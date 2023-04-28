import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from 'src/config';
import { RedisClient } from 'src/common/decorator';
import { CacheNamespace } from 'src/enum';
import { Room } from './room.type';
import { CreatePersistentRoomsDto, CreateTemporaryRoomsDto } from './dto';
import { PrismaService } from 'src/common/service/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomService {
  @RedisClient()
  private readonly redis: Redis;

  constructor(private prismaService: PrismaService) {}

  /**
   * Check if user is in any room.
   *
   * @param memberId
   * @returns
   */
  private async isMemberOfAny(memberId: number) {
    const roomIds = await this.redis.llen(
      `${CacheNamespace.UId2RIds}${memberId}`,
    );

    return roomIds > 0;
  }

  /**
   * Store rooms temporarily.
   *
   * @param rooms
   * @returns created rooms and socket ids of members.
   */
  private async storeRooms(rooms: Room[]) {
    const socketIdsList: string[][] = [];
    const joinerIdsList: number[][] = [];
    const redisPipe = this.redis.pipeline();

    rooms.map((room) => {
      const memberSIdKeys = room.memberIds.map((mId) => {
        // By the way, bind room id with member id
        redisPipe.lpush(`${CacheNamespace.UId2RIds}${mId}`, room.id);

        return `${CacheNamespace.UID2SId}${mId}`;
      });

      joinerIdsList.push(room.memberIds);
      redisPipe
        .mget(...memberSIdKeys)
        .set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room));

      return room;
    });

    (await redisPipe.exec()).forEach((res) => {
      if (Array.isArray(res[1])) {
        socketIdsList.push(res[1]);
      }
    });

    return {
      rooms,
      socketIdsList,
      joinerIdsList,
    };
  }

  /**
   * Create temporary rooms with given settings.
   *
   * @param dto
   * @returns created rooms and socket ids of members.
   */
  async createTemporarily(dto: CreateTemporaryRoomsDto) {
    return this.storeRooms(
      dto.rooms.map((setting) => ({
        ...setting,
        id: uuidv4(),
      })),
    );
  }

  /**
   * Store chat room of a game into database.
   *
   * @param id
   * @returns created chat room.
   */
  private async storeChatRoom(id: number) {
    try {
      return await this.prismaService.chatRoom.create({
        select: {
          id: true,
        },
        data: {
          id,
        },
      });
    } catch (_) {
      throw new BadRequestException('Unable to create chat room!');
    }
  }

  /**
   * Create persistent rooms with given settings.
   *
   * @param dto
   * @returns created rooms and socket ids of members.
   */
  async createPersistently(dto: CreatePersistentRoomsDto) {
    const { id: gameId } = await this.storeChatRoom(dto.gameId);

    return this.storeRooms(
      dto.rooms.map((setting) => ({
        ...setting,
        id: `${gameId}:${setting.id}`,
        gameId,
      })),
    );
  }

  /**
   * Remove many rooms by given room ids.
   *
   * @param roomIds
   * @returns removed rooms and socket ids of members in removed rooms.
   */
  async remove(roomIds: string[]) {
    const rooms: Room[] = (
      await this.redis.mget(
        ...roomIds.map((rId) => `${CacheNamespace.Room}${rId}`),
      )
    )
      .filter((roomJSON) => roomJSON != null)
      .map((roomJSON) => JSON.parse(roomJSON));
    const socketIdsList: string[][] = [];
    const leaverIdsList: number[][] = [];
    const redisPipe = this.redis.pipeline();

    rooms.forEach((room) => {
      const memberSIdKeys = room.memberIds.map((mId) => {
        // By the way, remove room id from member id
        redisPipe.lrem(`${CacheNamespace.UId2RIds}${mId}`, 1, room.id);

        return `${CacheNamespace.UID2SId}${mId}`;
      });

      leaverIdsList.push(room.memberIds);
      redisPipe.mget(...memberSIdKeys).del(`${CacheNamespace.Room}${room.id}`);
    });

    (await redisPipe.exec()).forEach((res) => {
      if (Array.isArray(res[1])) {
        socketIdsList.push(res[1]);
      }
    });

    return { rooms, socketIdsList, leaverIdsList };
  }

  /**
   * Add members to room.
   *
   * @param roomId
   * @param memberIds
   * @returns updated room and socket id of members.
   */
  async addMembers(roomId: string, memberIds: number[]) {
    const room = await this.get(roomId);
    const redisPipe = this.redis.pipeline();
    const memberSIdKeys: string[] = [];

    memberIds.forEach((mId) => {
      if (!room.memberIds.includes(mId)) {
        room.memberIds.push(mId);
        memberSIdKeys.push(`${CacheNamespace.UID2SId}${mId}`);
        redisPipe.lpush(`${CacheNamespace.UId2RIds}${mId}`, room.id);
      }
    });

    const redisRes = await redisPipe
      .set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room))
      .mget(...memberSIdKeys)
      .exec();

    return {
      room,
      socketIds: (redisRes[redisPipe.length - 1][1] as string[]) || [],
    };
  }

  /**
   * Remove members from room.
   *
   * @param roomId
   * @param memberIds
   * @returns updated room and socket id of members.
   */
  async removeMembers(roomId: string, memberIds: number[]) {
    const room = await this.get(roomId);
    const redisPipe = this.redis.pipeline();
    const memberSIdKeys: string[] = [];

    memberIds.forEach((mId) => {
      const removedMemberIndex = room.memberIds.indexOf(mId);

      if (removedMemberIndex !== -1) {
        room.memberIds.splice(removedMemberIndex, 1);
        memberSIdKeys.push(`${CacheNamespace.UID2SId}${mId}`);
        redisPipe.lrem(`${CacheNamespace.UId2RIds}${mId}`, 1, room.id);
      }
    });

    const redisRes = await redisPipe
      .set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room))
      .mget(...memberSIdKeys)
      .exec();

    return {
      room,
      socketIds: (redisRes[redisPipe.length - 1][1] as string[]) || [],
    };
  }

  /**
   * Allow chatting in room or not.
   *
   * @param roomId
   * @param mute
   * @returns updated room.
   */
  async allowChat(roomId: string, mute = true) {
    const room = await this.get(roomId);

    if (room.isMuted !== mute) {
      room.isMuted = mute;
    }

    await this.redis.set(
      `${CacheNamespace.Room}${roomId}`,
      JSON.stringify(room),
    );

    return room;
  }

  /**
   * Create a room and add the booker to its member list.
   * If multi-room join is disabled, the booker must not
   * enter any room before creating the room.
   *
   * @param bookerId
   * @param isPublic if true, anyone can join without invitation.
   * @returns updated room.
   */
  async book(bookerId: number, isPublic = false) {
    if (
      !AppConfig.allowJoinMultipleRooms &&
      (await this.isMemberOfAny(bookerId))
    ) {
      throw new BadRequestException(
        'Please leave current room before creating a new one',
      );
    }

    const room: Room = {
      id: uuidv4(),
      isPublic,
      isPersistent: false,
      isMuted: false,
      gameId: 0,
      ownerId: bookerId,
      memberIds: [bookerId],
      waitingIds: [],
      refusedIds: [],
    };

    await this.redis
      .pipeline()
      .set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room))
      .lpush(`${CacheNamespace.UId2RIds}${bookerId}`, room.id)
      .exec();

    return room;
  }

  /**
   * Get room by id.
   *
   * @param roomId
   * @returns
   */
  async get(roomId: string) {
    const roomJSON = await this.redis.get(`${CacheNamespace.Room}${roomId}`);

    if (roomJSON === null) {
      throw new BadRequestException('Room does not exist!');
    }

    const room: Room = JSON.parse(roomJSON);

    return room;
  }

  /**
   * Get rooms by ids.
   *
   * @param roomIds
   * @returns
   */
  async getMany(roomIds: string[]) {
    const rooms: Room[] = [];
    const redisPipe = this.redis.pipeline();
    roomIds.forEach((rId) => redisPipe.get(`${CacheNamespace.Room}${rId}`));

    (await redisPipe.exec()).forEach((val) => {
      if (typeof val[1] === 'string') {
        rooms.push(JSON.parse(val[1] as string));
      }
    });

    return rooms;
  }

  /**
   * Add user to room. If multi-room join is disabled,
   * the booker must not enter any room before creating
   * the room.
   *
   * @param joinerId
   * @param roomId
   * @returns updated room.
   */
  async join(joinerId: number, roomId: string) {
    if (
      !AppConfig.allowJoinMultipleRooms &&
      (await this.isMemberOfAny(joinerId))
    ) {
      throw new BadRequestException(
        'Please leave current room before joining another one!',
      );
    }

    const room = await this.get(roomId);

    if (!room.isPublic || room.isPersistent) {
      throw new ForbiddenException('This room is private!');
    }

    if (room.memberIds.includes(joinerId)) {
      throw new BadRequestException('You have already joined this room!');
    }

    room.memberIds.push(joinerId);
    room.waitingIds.splice(room.waitingIds.indexOf(joinerId), 1);
    room.refusedIds.splice(room.waitingIds.indexOf(joinerId), 1);

    await this.redis
      .pipeline()
      .set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room))
      .lpush(`${CacheNamespace.UId2RIds}${joinerId}`, room.id)
      .exec();

    return room;
  }

  /**
   * Remove user from room. Transfer ownership for to a member
   * in room if leaver is owner. Empty room will be deleted.
   *
   * @param leaverId
   * @param roomId
   * @returns updated room.
   */
  async leave(leaverId: number, roomId: string) {
    const room = await this.get(roomId);
    const deletedMemberIndex = room.memberIds.indexOf(leaverId);

    if (deletedMemberIndex === -1) {
      throw new ForbiddenException('You are not in this room!');
    } else {
      room.memberIds.splice(deletedMemberIndex, 1);
      room.refusedIds.push(leaverId);
    }

    const redisPipe = this.redis.pipeline();

    // Delete room if all members have left
    if (room.memberIds.length === 0 && !room.isPersistent) {
      redisPipe.del(`${CacheNamespace.Room}${room.id}`);
    } else {
      // Assign owner to the first member
      if (leaverId === room.ownerId) {
        room.ownerId = room.memberIds[0];
      }

      redisPipe.set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room));
    }

    await redisPipe
      .lrem(`${CacheNamespace.UId2RIds}${leaverId}`, 1, room.id)
      .exec();

    return room;
  }

  /**
   * Remove user from many rooms. Logic is the same
   * as `leave` method.
   *
   * @param leaverId
   * @param roomIds empty if leaving all rooms.
   * @returns updated rooms.
   */
  async leaveMany(leaverId: number, ...roomIds: string[]) {
    if (roomIds.length === 0) {
      roomIds = await this.redis.lrange(
        `${CacheNamespace.UId2RIds}${leaverId}`,
        0,
        -1,
      );

      if (roomIds.length === 0) {
        return [];
      }
    }

    let rooms = await this.getMany(roomIds);
    const redisPipe = this.redis.pipeline();

    rooms = rooms.map((room) => {
      room.memberIds.splice(room.memberIds.indexOf(leaverId), 1);
      room.refusedIds.push(leaverId);

      // Delete room if all members have left
      if (room.memberIds.length === 0 && !room.isPersistent) {
        redisPipe.del(`${CacheNamespace.Room}${room.id}`);
      } else {
        // Assign owner to the first member
        if (leaverId === room.ownerId) {
          room.ownerId = room.memberIds[0];
        }

        redisPipe.set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room));
      }

      redisPipe
        .lrem(`${CacheNamespace.UId2RIds}${leaverId}`, 1, room.id)
        .exec();

      return room;
    });

    await redisPipe.exec();

    return rooms;
  }

  /**
   * Kick member out of room. Kicker must be the owner
   * and member must be in the room, otherwise the action
   * is declined.
   *
   * @param kickerId
   * @param memberId
   * @param roomId
   * @returns updated room and socket id of kicked member.
   */
  async kick(kickerId: number, memberId: number, roomId: string) {
    if (kickerId === memberId) {
      const room = await this.leave(kickerId, roomId);

      return { room, kickedMemberSId: kickerId };
    }

    const room = await this.get(roomId);

    if (room.ownerId !== kickerId) {
      throw new ForbiddenException('You are not owner of this room!');
    }

    const deletedMemberIndex = room.memberIds.indexOf(memberId);

    if (deletedMemberIndex === -1) {
      throw new BadRequestException('Member is not in this room!');
    }

    room.memberIds.splice(deletedMemberIndex, 1);
    room.refusedIds.push(memberId);

    const [[, kickedMemberSId]] = await this.redis
      .pipeline()
      .get(`${CacheNamespace.UID2SId}${memberId}`)
      .set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room))
      .lrem(`${CacheNamespace.UId2RIds}${memberId}`, 1, room.id)
      .exec();

    return {
      room,
      kickedMemberSocketId: kickedMemberSId as string,
    };
  }

  /**
   * Transfer ownership to another member. Decline action
   * if room is empty, actor is not owner, or choosed member
   * does not exist in the room.
   *
   * @param ownerId
   * @param candidateId
   * @param roomId
   * @returns update room.
   */
  async transferOwnership(
    ownerId: number,
    candidateId: number,
    roomId: string,
  ) {
    const room = await this.get(roomId);

    if (room.ownerId !== ownerId) {
      throw new ForbiddenException('You are not owner of this room!');
    }

    if (ownerId === candidateId || !room.memberIds.includes(candidateId)) {
      throw new BadRequestException('New owner must be a member in this room!');
    }

    room.ownerId = candidateId;

    await this.redis.set(
      `${CacheNamespace.Room}${room.id}`,
      JSON.stringify(room),
    );

    return room;
  }

  /**
   * Invite a guest into room. Only invite online user and
   * non-exist in room user.
   *
   * @param inviter
   * @param guestId
   * @param roomId
   * @returns updated room and guest socket ids.
   */
  async invite(inviter: number, guestId: number, roomId: string) {
    const [[, roomJSON], [, guestSId]] = (await this.redis
      .pipeline()
      .get(`${CacheNamespace.Room}${roomId}`)
      .get(`${CacheNamespace.UID2SId}${guestId}`)
      .exec()) as [error: any, result: string | string[]][];

    if (roomJSON == null) {
      throw new NotFoundException('Room does not exist!');
    }

    const room: Room = JSON.parse(roomJSON as string);

    if (room.isPersistent) {
      throw new ForbiddenException(
        'You can not invite other user to this room!',
      );
    }

    if (guestSId == null) {
      throw new BadRequestException('Please only invite online user!');
    }

    if (!room.memberIds.includes(inviter)) {
      throw new ForbiddenException('You are not in this room!');
    }

    if (room.memberIds.includes(guestId) || room.waitingIds.includes(guestId)) {
      throw new BadRequestException('This user has been invited!');
    }

    room.waitingIds.push(guestId);
    room.refusedIds.splice(room.waitingIds.indexOf(guestId), 1);

    await this.redis.set(
      `${CacheNamespace.Room}${room.id}`,
      JSON.stringify(room),
    );

    return { room, guestSocketId: guestSId };
  }

  /**
   * Respond to room invitation. There are 2 options:
   * accept and refuse. Leave the current room after
   * accepting if multi-room join is disabled.
   *
   * @param guestId
   * @param isAccpeted
   * @param roomId
   * @returns updated room and left rooms.
   */
  async respondInvitation(
    guestId: number,
    isAccpeted: boolean,
    roomId: string,
  ) {
    let leftRooms: Room[] = [];
    const room = await this.get(roomId);
    const deletedWaitingIndex = room.waitingIds.indexOf(guestId);

    if (deletedWaitingIndex === -1) {
      throw new BadRequestException('You are not invited to this room!');
    }

    const redisPipe = this.redis.pipeline();

    room.waitingIds.splice(deletedWaitingIndex, 1);

    if (isAccpeted) {
      // Leave all current rooms if multi-room join is disabled
      if (
        !AppConfig.allowJoinMultipleRooms &&
        (await this.isMemberOfAny(guestId))
      ) {
        leftRooms = await this.leaveMany(guestId);
      }

      room.memberIds.push(guestId);
      redisPipe.lpush(`${CacheNamespace.UId2RIds}${guestId}`, room.id);
    } else {
      room.refusedIds.push(guestId);
    }

    await redisPipe
      .set(`${CacheNamespace.Room}${room.id}`, JSON.stringify(room))
      .exec();

    return { room, leftRooms };
  }
}
