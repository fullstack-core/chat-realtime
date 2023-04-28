import { IsInt, IsString, IsNotEmpty, IsPositive } from 'class-validator';

export class KickOutOfRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsInt()
  @IsPositive()
  memberId: number;
}
