import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class InviteToRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsInt()
  @IsPositive()
  guestId: number;
}
