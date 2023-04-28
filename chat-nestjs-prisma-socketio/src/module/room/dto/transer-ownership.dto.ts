import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class TransferOwnershipDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsInt()
  @IsPositive()
  candidateId: number;
}
