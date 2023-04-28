export type Room = {
  id: string;
  isPublic: boolean;
  isPersistent: boolean;
  isMuted: boolean;
  gameId: number;
  ownerId: number;
  memberIds: number[];
  waitingIds: number[];
  refusedIds: number[];
};
