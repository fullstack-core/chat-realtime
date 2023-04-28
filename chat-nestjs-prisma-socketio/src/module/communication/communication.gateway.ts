import {
  Injectable,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  GatewayMetadata,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CORSConfig, ValidationConfig } from 'src/config';
import { ListenEvent } from 'src/enum';
import { AllExceptionFilter, WsExceptionsFilter } from 'src/common/filter';
import {
  EventNameBindingInterceptor,
  SocketUserIdBindingInterceptor,
} from 'src/common/interceptor';
import { EmitEvents } from 'src/type';
import {
  BookRoomDto,
  InviteToRoomDto,
  JoinRoomDto,
  KickOutOfRoomDto,
  LeaveRoomDto,
  RespondRoomInvitationDto,
  TransferOwnershipDto,
} from '../room/dto';
import { CommunicationService } from './communication.service';
import { SendRoomMessageDto, SendPrivateMessageDto } from '../message/dto';

@Injectable()
@UseFilters(new AllExceptionFilter(), new WsExceptionsFilter())
@UsePipes(new ValidationPipe(ValidationConfig))
@WebSocketGateway<GatewayMetadata>({
  namespace: '/',
  cors: CORSConfig,
})
export class CommunicationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  readonly server: Server<null, EmitEvents>;

  constructor(private communicationService: CommunicationService) {}

  /**
   * Store user state before connection.
   *
   * @param client socket client.
   */
  async handleConnection(client: Socket) {
    await this.communicationService.connect(this.server, client);
  }

  /**
   * Remove user state after disconnection.
   *
   * @param client socket client.
   */
  async handleDisconnect(client: Socket) {
    await this.communicationService.disconnect(this.server, client);
  }

  /**
   * Send private message.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.SendPrivateMessage),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.SendPrivateMessage)
  async sendPrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendPrivateMessageDto,
  ) {
    await this.communicationService.sendPrivateMessage(
      this.server,
      client,
      payload,
    );
  }

  /**
   * Send room message.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.SendRoomMessage),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.SendRoomMessage)
  async handleSendRoomMesage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendRoomMessageDto,
  ) {
    await this.communicationService.sendRoomMessage(
      this.server,
      client,
      payload,
    );
  }

  /**
   * Book a new room.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.BookRoom),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.BookRoom)
  async handleBookRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: BookRoomDto,
  ) {
    await this.communicationService.createTemporaryRoom(client, payload);
  }

  /**
   * Join to a new room.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.JoinRoom),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.JoinRoom)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    await this.communicationService.joinRoom(this.server, client, payload);
  }

  /**
   * Leave the room.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.LeaveRoom),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.LeaveRoom)
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket<null, EmitEvents>,
    @MessageBody() payload: LeaveRoomDto,
  ) {
    await this.communicationService.leaveRoom(this.server, client, payload);
  }

  /**
   * Kick member out of room.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.KickOutOfRoom),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.KickOutOfRoom)
  async handleKickOutOfRoom(
    @ConnectedSocket() client: Socket<null, EmitEvents>,
    @MessageBody() payload: KickOutOfRoomDto,
  ) {
    await this.communicationService.kickOutOfRoom(this.server, client, payload);
  }

  /**
   * Transfer ownership to another member in room.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.TranserOwnership),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.TranserOwnership)
  async handleTransferOwnership(
    @ConnectedSocket() client: Socket<null, EmitEvents>,
    @MessageBody() payload: TransferOwnershipDto,
  ) {
    await this.communicationService.transferRoomOwnership(
      this.server,
      client,
      payload,
    );
  }

  /**
   * Invite a guest into room.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.InviteToRoom),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.InviteToRoom)
  async handleInviteToRoom(
    @ConnectedSocket() client: Socket<null, EmitEvents>,
    @MessageBody() payload: InviteToRoomDto,
  ) {
    await this.communicationService.inviteToRoom(this.server, client, payload);
  }

  /**
   * Respond to room invitation.
   *
   * @param client socket client.
   * @param payload
   */
  @UseInterceptors(
    new EventNameBindingInterceptor(ListenEvent.RespondRoomInvitation),
    SocketUserIdBindingInterceptor,
  )
  @SubscribeMessage(ListenEvent.RespondRoomInvitation)
  async handleRespondInvitation(
    @ConnectedSocket() client: Socket<null, EmitEvents>,
    @MessageBody() payload: RespondRoomInvitationDto,
  ) {
    await this.communicationService.respondRoomInvitation(
      this.server,
      client,
      payload,
    );
  }
}
