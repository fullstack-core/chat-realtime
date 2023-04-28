import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/common/service/auth.service';
import { AppConfig } from 'src/config';
import { ActiveStatus, EmitEvent, ListenEvent, RoomEvent } from 'src/enum';
import { EmitEvents } from 'src/type';
import { SendPrivateMessageDto, SendRoomMessageDto } from '../message/dto';
import { MessageService } from '../message/message.service';
import {
  BookRoomDto,
  InviteToRoomDto,
  JoinRoomDto,
  KickOutOfRoomDto,
  LeaveRoomDto,
  RespondRoomInvitationDto,
  TransferOwnershipDto,
} from '../room/dto';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CommunicationService {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private messageService: MessageService,
    private roomService: RoomService,
  ) {}

  /**
   * Verify token.
   *
   * @param headerAuthorization
   * @returns user record.
   */
  private async validateAuthorization(headerAuthorization: string) {
    const token = String(headerAuthorization).replace('Bearer ', '');
    const user = await this.authService.getUser(token);

    return user;
  }

  /**
   * Solve conflict if multiple people connect to the
   * same account.
   *
   * @param server websocket server.
   * @param user
   */
  private async handleConflict(server: Server<null, EmitEvents>, user: User) {
    if (!AppConfig.disconnectIfConflict) {
      throw new BadRequestException('Your account is in use!');
    }

    const { disconnectedId, leftRooms } = await this.userService.disconnect(
      user,
    );

    server.to(disconnectedId).emit(EmitEvent.Error, {
      event: ListenEvent.Connect,
      message: 'This account is being connected by someone else!',
    });
    server.to(disconnectedId).disconnectSockets();

    leftRooms.forEach((room) => {
      if (room.memberIds.length > 0) {
        server.to(room.id).emit(EmitEvent.ReceiveRoomChanges, {
          event: RoomEvent.Leave,
          actorIds: [user.id],
          room,
        });
      }
    });
  }

  /**
   * Check if the connection satisfies some sepecific conditions
   * before allowing the connection.
   *
   * @param server websocket server.
   * @param client socket client.
   * @returns updated user.
   */
  private async validateConnection(server: Server, client: Socket) {
    const user = await this.validateAuthorization(
      client.handshake.headers.authorization,
    );

    if (user.statusId != null) {
      await this.handleConflict(server, user);
    }

    return user;
  }

  /**
   * Connect the client.
   *
   * @param server websocket server.
   * @param client socket client.
   */
  async connect(server: Server<null, EmitEvents>, client: Socket) {
    try {
      const user = await this.validateConnection(server, client);
      await this.userService.connect(user, client.id);

      const friendSIds = await this.userService.getOnlineFriendsSocketIds(
        user.id,
      );
      server.to(friendSIds).emit(EmitEvent.UpdateFriendStatus, {
        id: user.id,
        status: ActiveStatus.Online,
      });
    } catch (error: any) {
      client.emit(EmitEvent.Error, {
        event: ListenEvent.Connect,
        message: error.message,
      });
      client.disconnect();
    }
  }

  /**
   * Disconnect the client.
   *
   * @param server websocket server.
   * @param client socket client.
   */
  async disconnect(server: Server<null, EmitEvents>, client: Socket) {
    try {
      const user = await this.userService.getBySocketId(client.id);

      if (user != null) {
        const friendSIds = await this.userService.getOnlineFriendsSocketIds(
          user.id,
        );
        const { leftRooms } = await this.userService.disconnect(user);

        server.to(friendSIds).emit(EmitEvent.UpdateFriendStatus, {
          id: user.id,
          status: ActiveStatus.Offline,
        });

        leftRooms.forEach((room) => {
          if (room.memberIds.length > 0) {
            server.to(room.id).emit(EmitEvent.ReceiveRoomChanges, {
              event: RoomEvent.Leave,
              actorIds: [client.userId],
              room,
            });
          }
        });
      }
    } catch (error) {
      //
    }
  }

  /**
   * Send a private message to friend.
   *
   * @param server websocket server.
   * @param client socket client.
   * @param payload
   */
  async sendPrivateMessage(
    server: Server<null, EmitEvents>,
    client: Socket,
    payload: SendPrivateMessageDto,
  ) {
    await this.messageService.createPrivateMessage(client.userId, payload);
    const receiverSId = await this.userService.getSocketIdByUserId(
      payload.receiverId,
    );

    if (receiverSId != null) {
      server.to(receiverSId).emit(EmitEvent.ReceivePrivateMessage, {
        ...payload,
        senderId: client.userId,
      });
    }
  }

  /**
   * Send a message to joined room.
   *
   * @param server websocket server.
   * @param client socket client.
   * @param payload
   */
  async sendRoomMessage(
    server: Server<null, EmitEvents>,
    client: Socket,
    payload: SendRoomMessageDto,
  ) {
    const room = await this.roomService.get(payload.roomId);

    if (room.isMuted) {
      throw new ForbiddenException('Unable to chat at this time!');
    }

    if (!room.memberIds.includes(client.userId)) {
      throw new ForbiddenException('You are not in this room!');
    }

    if (room.isPersistent) {
      await this.messageService.createRoomMessage(
        client.userId,
        room.gameId,
        payload,
      );
    }

    server.to(payload.roomId).emit(EmitEvent.ReceiveRoomMessage, {
      ...payload,
      senderId: client.userId,
    });
  }

  /**
   * Create a room that is deleted after all members leave.
   *
   * @param client socket client.
   * @param payload
   */
  async createTemporaryRoom(client: Socket, payload: BookRoomDto) {
    const room = await this.roomService.book(client.userId, payload.isPublic);
    client.join(room.id);

    client.emit(EmitEvent.ReceiveRoomChanges, {
      event: RoomEvent.Create,
      actorIds: [client.userId],
      room,
    });
  }

  /**
   * Join to new room.
   *
   * @param server websocket server.
   * @param client socket client.
   * @param payload
   */
  async joinRoom(
    server: Server<null, EmitEvents>,
    client: Socket,
    payload: JoinRoomDto,
  ) {
    const room = await this.roomService.join(client.userId, payload.roomId);
    client.join(room.id);

    server.to(room.id).emit(EmitEvent.ReceiveRoomChanges, {
      event: RoomEvent.Join,
      actorIds: [client.userId],
      room,
    });
  }

  /**
   * Leave the joined room.
   *
   * @param server websocket server.
   * @param client socket client.
   * @param payload
   */
  async leaveRoom(
    server: Server<null, EmitEvents>,
    client: Socket,
    payload: LeaveRoomDto,
  ) {
    const room = await this.roomService.leave(client.userId, payload.roomId);
    client.leave(room.id);

    server
      .to(client.id)
      .to(room.id)
      .emit(EmitEvent.ReceiveRoomChanges, {
        event: RoomEvent.Leave,
        actorIds: [client.userId],
        room,
      });
  }

  /**
   * Kick a member out of the room.
   *
   * @param server websocket server.
   * @param client socket client.
   * @param payload
   */
  async kickOutOfRoom(
    server: Server<null, EmitEvents>,
    client: Socket,
    payload: KickOutOfRoomDto,
  ) {
    const { room, kickedMemberSocketId } = await this.roomService.kick(
      client.userId,
      payload.memberId,
      payload.roomId,
    );

    server
      .to(kickedMemberSocketId)
      .to(room.id)
      .emit(EmitEvent.ReceiveRoomChanges, {
        event: RoomEvent.Kick,
        actorIds: [client.userId],
        room,
      });

    server.to(kickedMemberSocketId).socketsLeave(room.id);
  }

  /**
   * Transfer room ownership to a member in that room.
   *
   * @param server websocket server.
   * @param client socket client.
   * @param payload
   */
  async transferRoomOwnership(
    server: Server<null, EmitEvents>,
    client: Socket,
    payload: TransferOwnershipDto,
  ) {
    const room = await this.roomService.transferOwnership(
      client.userId,
      payload.candidateId,
      payload.roomId,
    );

    server.to(room.id).emit(EmitEvent.ReceiveRoomChanges, {
      event: RoomEvent.Owner,
      actorIds: [client.userId],
      room,
    });
  }

  /**
   * Send a room invitation to user.
   *
   * @param server websocket server.
   * @param client socket client.
   * @param payload
   */
  async inviteToRoom(
    server: Server<null, EmitEvents>,
    client: Socket,
    payload: InviteToRoomDto,
  ) {
    const { room, guestSocketId } = await this.roomService.invite(
      client.userId,
      payload.guestId,
      payload.roomId,
    );

    server.to(guestSocketId).emit(EmitEvent.ReceiveRoomInvitation, {
      roomId: room.id,
      inviterId: client.userId,
    });
    server.to(room.id).emit(EmitEvent.ReceiveRoomChanges, {
      event: RoomEvent.Invite,
      actorIds: [client.userId],
      room,
    });
  }

  /**
   * Respond to a room invitation.
   *
   * @param server websocket server.
   * @param client socket client.
   * @param payload
   */
  async respondRoomInvitation(
    server: Server<null, EmitEvents>,
    client: Socket,
    payload: RespondRoomInvitationDto,
  ) {
    const { room, leftRooms } = await this.roomService.respondInvitation(
      client.userId,
      payload.isAccpeted,
      payload.roomId,
    );

    if (payload.isAccpeted) {
      client.join(room.id);

      server.to(room.id).emit(EmitEvent.ReceiveRoomChanges, {
        event: RoomEvent.Join,
        actorIds: [client.userId],
        room,
      });

      leftRooms.forEach((room) => {
        if (room.memberIds.length > 0) {
          server.to(room.id).emit(EmitEvent.ReceiveRoomChanges, {
            event: RoomEvent.Leave,
            actorIds: [client.userId],
            room,
          });
        }
      });
    }
  }
}
