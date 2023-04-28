import { IsBoolean, IsNotEmpty } from 'class-validator';

export class BookRoomDto {
  @IsBoolean()
  @IsNotEmpty()
  isPublic: boolean;
}
