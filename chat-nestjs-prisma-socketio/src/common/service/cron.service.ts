import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppConfig } from 'src/config';
import { MessageService } from 'src/module/message/message.service';

@Injectable()
export class CronService {
  constructor(private messageService: MessageService) {}

  @Cron(AppConfig.messageManagment.private.cronTime)
  async clearPrivateMessage() {
    await this.messageService.removeOldPrivateMessage(
      AppConfig.messageManagment.private.maxOld,
    );
  }

  @Cron(AppConfig.messageManagment.room.cronTime)
  async clearRoomMessage() {
    await this.messageService.removeOldRoomMessage(
      AppConfig.messageManagment.room.maxOld,
    );
  }
}
