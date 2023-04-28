import { Module } from '@nestjs/common';
import { PrismaService } from 'src/common/service/prisma.service';
import { RoomService } from '../room/room.service';
import { UserService } from '../user/user.service';
import { MessageService } from './message.service';

@Module({
  providers: [MessageService, PrismaService, UserService, RoomService],
  exports: [MessageService],
})
export class MessageModule {
  //
}
