import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { RoomModule } from '../room/room.module';
import { AuthService } from 'src/common/service/auth.service';
import { PrismaService } from 'src/common/service/prisma.service';
import { MessageModule } from '../message/message.module';
import { CommunicationService } from './communication.service';
import { CommunicationGateway } from './communication.gateway';

@Module({
  imports: [UserModule, RoomModule, MessageModule],
  providers: [
    CommunicationGateway,
    CommunicationService,
    AuthService,
    PrismaService,
  ],
  exports: [CommunicationGateway],
})
export class CommunicationModule {}
