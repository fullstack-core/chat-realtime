import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './common/service/cron.service';
import { CommunicationModule } from './module/communication/communication.module';
import { MessageModule } from './module/message/message.module';
import { RoomModule } from './module/room/room.module';
import { UserModule } from './module/user/user.module';

@Module({
  imports: [
    CommunicationModule,
    UserModule,
    RoomModule,
    MessageModule,
    ScheduleModule.forRoot(),
  ],
  providers: [CronService],
})
export class AppModule {}
