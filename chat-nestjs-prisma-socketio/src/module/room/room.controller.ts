import { Body, Controller, Delete, Post, Res, UseGuards } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ApiKeyGuard } from 'src/common/guard';
import { EmitEvent, RoomEvent } from 'src/enum';
import { CommunicationGateway } from '../communication/communication.gateway';
import {
  AddToRoomDto,
  CreatePersistentRoomsDto,
  CreateTemporaryRoomsDto,
  RemoveFromRoomDto,
  RemoveRoomsDto,
} from './dto';
import { MuteRoomDto } from './dto/mute-room.dto';
import { RoomService } from './room.service';
import { Room } from './room.type';

@Controller('rooms')
export class RoomController {
  constructor(
    private roomService: RoomService,
    private communicationGateway: CommunicationGateway,
  ) {}

  /**
   * Notify room joins to all members.
   *
   * @param socketIdsList
   * @param rooms
   * @param joinerIdsLst
   */
  private notifyRoomJoins(
    socketIdsList: string[][],
    rooms: Room[],
    joinerIdsLst: number[][],
  ) {
    socketIdsList.forEach((sIds, i) => {
      this.communicationGateway.server.to(sIds).socketsJoin(rooms[i].id);
      this.communicationGateway.server
        .to(sIds)
        .emit(EmitEvent.ReceiveRoomChanges, {
          event: RoomEvent.Join,
          actorIds: joinerIdsLst[i],
          room: rooms[i],
        });
    });
  }

  /**
   * Notify room leaves to all members.
   *
   * @param socketIdsList
   * @param rooms
   * @param leaverIdsList
   */
  private notifyRoomLeaves(
    socketIdsList: string[][],
    rooms: Room[],
    leaverIdsList: number[][],
  ) {
    socketIdsList.forEach((sIds, i) => {
      this.communicationGateway.server.to(sIds).socketsLeave(rooms[i].id);
      this.communicationGateway.server
        .to(sIds)
        .emit(EmitEvent.ReceiveRoomChanges, {
          event: RoomEvent.Leave,
          actorIds: leaverIdsList[i],
          room: rooms[i],
        });
    });
  }

  /**
   * Create many temporary rooms at once.
   *
   * @param payload
   * @param response
   */
  @Post('temporary')
  @UseGuards(ApiKeyGuard)
  async createTemporarily(
    @Body() payload: CreateTemporaryRoomsDto,
    @Res() response: FastifyReply,
  ) {
    const { rooms, socketIdsList, joinerIdsList } =
      await this.roomService.createTemporarily(payload);

    this.notifyRoomJoins(socketIdsList, rooms, joinerIdsList);
    response.code(201).send({
      data: rooms,
    });
  }

  /**
   * Create many persistent rooms at once.
   *
   * @param payload
   * @param response
   */
  @Post('persistent')
  @UseGuards(ApiKeyGuard)
  async createPersistently(
    @Body() payload: CreatePersistentRoomsDto,
    @Res() response: FastifyReply,
  ) {
    const { rooms, socketIdsList, joinerIdsList } =
      await this.roomService.createPersistently(payload);

    this.notifyRoomJoins(socketIdsList, rooms, joinerIdsList);
    response.code(201).send({
      data: rooms,
    });
  }

  /**
   * Remove many room at once.
   *
   * @param payload
   * @param response
   */
  @Delete()
  @UseGuards(ApiKeyGuard)
  async remove(@Body() payload: RemoveRoomsDto, @Res() response: FastifyReply) {
    const { rooms, socketIdsList, leaverIdsList } =
      await this.roomService.remove(payload.ids);

    this.notifyRoomLeaves(socketIdsList, rooms, leaverIdsList);
    response.code(200).send({
      data: true,
    });
  }

  /**
   * Add many members to room.
   *
   * @param payload
   * @param response
   */
  @Post('members')
  @UseGuards(ApiKeyGuard)
  async addMembers(
    @Body() payload: AddToRoomDto,
    @Res() response: FastifyReply,
  ) {
    const { room, socketIds } = await this.roomService.addMembers(
      payload.roomId,
      payload.memberIds,
    );

    this.notifyRoomJoins([socketIds], [room], [payload.memberIds]);
    response.code(200).send({
      data: room,
    });
  }

  /**
   * Remove many members from room.
   *
   * @param payload
   * @param response
   */
  @Delete('members')
  @UseGuards(ApiKeyGuard)
  async removeMembers(
    @Body() payload: RemoveFromRoomDto,
    @Res() response: FastifyReply,
  ) {
    const { room, socketIds } = await this.roomService.removeMembers(
      payload.roomId,
      payload.memberIds,
    );

    this.notifyRoomLeaves([socketIds], [room], [payload.memberIds]);
    response.code(200).send({
      data: room,
    });
  }

  @Post('mute')
  @UseGuards(ApiKeyGuard)
  async mute(@Body() payload: MuteRoomDto, @Res() response: FastifyReply) {
    const room = await this.roomService.allowChat(payload.roomId, payload.mute);

    this.communicationGateway.server
      .to(room.id)
      .emit(EmitEvent.ReceiveRoomChanges, {
        event: RoomEvent.Mute,
        actorIds: [],
        room,
      });
    response.code(201).send({
      data: room,
    });
  }
}
