import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class RespondRoomInvitationDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsBoolean()
  isAccpeted: boolean;
}
