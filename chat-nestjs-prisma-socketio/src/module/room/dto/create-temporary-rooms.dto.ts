import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsNumber,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Room } from '../room.type';

class CreateRoomDto implements Room {
  @IsBoolean()
  isPublic: boolean;

  @ValidateIf((dto: CreateRoomDto, v) => !dto.memberIds?.includes(v))
  @Equals(undefined, { message: '$property must be contained in memberIds' })
  ownerId: number;

  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @ArrayUnique()
  memberIds: number[];

  id: string;

  isPersistent = false;

  isMuted = false;

  gameId = 0;

  waitingIds: number[] = [];

  refusedIds: number[] = [];
}

export class CreateTemporaryRoomsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRoomDto)
  rooms: CreateRoomDto[];
}
