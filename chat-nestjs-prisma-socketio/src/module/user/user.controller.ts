import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthGuard } from 'src/common/guard';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Get friend list of logged in user.
   *
   * @param request
   * @param response
   */
  @Get('friends')
  async getFriendList(
    @Req() request: FastifyRequest,
    @Res() response: FastifyReply,
  ) {
    const friendList = await this.userService.getFriendList(request.user.id);

    response.code(200).send({
      data: friendList,
    });
  }
}
