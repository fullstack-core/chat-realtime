import { BadRequestException, Injectable } from '@nestjs/common';
import moment from 'moment';
import { PrismaService } from 'src/common/service/prisma.service';
import { UserService } from '../user/user.service';
import { SendPrivateMessageDto, SendRoomMessageDto } from './dto';

@Injectable()
export class MessageService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
  ) {}

  /**
   * Store new private message.
   *
   * @param senderId
   * @param privateMessageDto
   * @returns
   */
  async createPrivateMessage(
    senderId: number,
    privateMessageDto: SendPrivateMessageDto,
  ) {
    if (
      !(await this.userService.areFriends(
        senderId,
        privateMessageDto.receiverId,
      ))
    ) {
      throw new BadRequestException(
        'Only friends can send messages to each other!',
      );
    }

    return this.prismaService.privateMessage.create({
      data: {
        ...privateMessageDto,
        senderId,
      },
    });
  }

  /**
   * Store new room message.
   *
   * @param senderId
   * @param gameId
   * @param roomMessageDto
   * @returns
   */
  createRoomMessage(
    senderId: number,
    roomId: number,
    roomMessageDto: SendRoomMessageDto,
  ) {
    return this.prismaService.roomMessage.create({
      data: {
        roomId,
        senderId,
        content: roomMessageDto.content,
      },
    });
  }

  /**
   * Remove all old private messages.
   *
   * @param maxOld max old of message in second.
   * @returns
   */
  removeOldPrivateMessage(maxOld: number) {
    return this.prismaService.privateMessage.deleteMany({
      where: {
        createdAt: {
          lt: moment().subtract(maxOld, 'seconds').toDate(),
        },
      },
    });
  }

  /**
   * Remove all old room messages.
   *
   * @param maxOld max old of message in second.
   * @returns
   */
  removeOldRoomMessage(maxOld: number) {
    return this.prismaService.roomMessage.deleteMany({
      where: {
        createdAt: {
          lt: moment().subtract(maxOld, 'seconds').toDate(),
        },
      },
    });
  }
}
