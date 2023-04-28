import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Room } from '../room.type';

class CreatePersistentRoomDto implements Room {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsBoolean()
  isMuted: boolean;

  @IsNumber({}, { each: true })
  @IsPositive({ each: true })
  @ArrayUnique()
  memberIds: number[];

  ownerId: number;

  gameId: number;

  isPublic: boolean;

  isPersistent = true;

  waitingIds: number[] = [];

  refusedIds: number[] = [];
}

export class CreatePersistentRoomsDto {
  @IsNumber()
  @IsPositive()
  gameId: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((value: CreatePersistentRoomDto) => value.id)
  @ValidateNested({ each: true })
  @Type(() => CreatePersistentRoomDto)
  rooms: CreatePersistentRoomDto[];
}
