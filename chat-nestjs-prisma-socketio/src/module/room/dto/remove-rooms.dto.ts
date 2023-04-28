import { ArrayMinSize, IsNotEmpty, IsString } from 'class-validator';

export class RemoveRoomsDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  ids: string[];
}
