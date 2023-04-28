import {
  ArrayUnique,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class RemoveFromRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  memberIds: number[];
}
