import { ActiveStatus, EmitEvent, RoomEvent } from 'src/enum';
import { Room } from 'src/module/room/room.type';
import { WsErrorResponse } from './error.type';

type SuccessResponse = {
  message: string;
};

type UpdateFriendStatusData = {
  id: number;
  status: ActiveStatus | null;
};

type ReceivePrivateMessageData = {
  senderId: number;
  content: string;
};

type ReceiveRoomMessageData = ReceivePrivateMessageData & {
  roomId: string;
};

type ReceiveRoomInvitationData = {
  inviterId: number;
  roomId: string;
};

type ReceiveRoomChangesData = {
  event: RoomEvent;
  actorIds: number[];
  room: Partial<Room> & Pick<Room, 'id'>;
};

export type EmitEvents = {
  [EmitEvent.Error]: (response: WsErrorResponse) => void;
  [EmitEvent.Success]: (response: SuccessResponse) => void;
  [EmitEvent.UpdateFriendStatus]: (data: UpdateFriendStatusData) => void;
  [EmitEvent.ReceivePrivateMessage]: (data: ReceivePrivateMessageData) => void;
  [EmitEvent.ReceiveRoomMessage]: (data: ReceiveRoomMessageData) => void;
  [EmitEvent.ReceiveRoomInvitation]: (data: ReceiveRoomInvitationData) => void;
  [EmitEvent.ReceiveRoomChanges]: (data: ReceiveRoomChangesData) => void;
};
