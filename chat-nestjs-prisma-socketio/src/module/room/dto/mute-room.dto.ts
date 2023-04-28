import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class MuteRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsBoolean()
  mute: boolean;
}
