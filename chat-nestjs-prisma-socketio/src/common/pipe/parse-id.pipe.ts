import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIdPipe implements PipeTransform {
  transform(value: any) {
    value = parseInt(value, 10);

    if (value > 0) {
      return value;
    }

    throw new BadRequestException('Invalid user id');
  }
}
