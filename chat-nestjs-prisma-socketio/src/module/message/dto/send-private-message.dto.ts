import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class SendPrivateMessageDto {
  @IsInt()
  @IsPositive()
  receiverId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
