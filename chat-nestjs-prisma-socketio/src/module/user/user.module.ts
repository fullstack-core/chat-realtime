import { Module } from '@nestjs/common';
import { AuthService } from 'src/common/service/auth.service';
import { PrismaService } from 'src/common/service/prisma.service';
import { RoomModule } from '../room/room.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [RoomModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, AuthService],
  exports: [UserService],
})
export class UserModule {
  //
}
