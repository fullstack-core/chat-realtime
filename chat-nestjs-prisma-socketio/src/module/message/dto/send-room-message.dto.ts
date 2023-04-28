import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SendRoomMessageDto {
  @IsString()
  @MinLength(13)
  roomId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
