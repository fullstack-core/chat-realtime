export enum ListenEvent {
  Connect = 'connect',
  SendPrivateMessage = 'send_private_message',
  SendRoomMessage = 'send_room_message',
  BookRoom = 'book_room',
  JoinRoom = 'join_room',
  LeaveRoom = 'leave_room',
  InviteToRoom = 'invite_to_room',
  RespondRoomInvitation = 'respond_room_invitation',
  KickOutOfRoom = 'kick_out_of_room',
  TranserOwnership = 'transfer_ownership',
}

export enum EmitEvent {
  Error = 'error',
  Success = 'success',
  UpdateFriendStatus = 'update_friend_status',
  ReceivePrivateMessage = 'receive_private_message',
  ReceiveRoomMessage = 'receive_room_message',
  ReceiveRoomInvitation = 'receive_room_invitation',
  ReceiveRoomChanges = 'receive_room_changes',
}

export enum RoomEvent {
  Create = 0,
  Kick = 1,
  Leave = 2,
  Join = 3,
  Owner = 4,
  Invite = 5,
  Remove = 6,
  Mute = 7,
}
