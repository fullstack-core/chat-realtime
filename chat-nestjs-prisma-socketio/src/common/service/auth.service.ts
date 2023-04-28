import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Auth } from 'firebase-admin/auth';
import { FirebaseAuth } from 'src/common/decorator';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  @FirebaseAuth()
  private readonly auth: Auth;

  constructor(private prismaService: PrismaService) {}

  /**
   * Get uid generated by firebase authentication using
   * ID token provided by it.
   *
   * @param token
   * @returns
   */
  private async getFirebaseUserId(token: string) {
    let fid: string;

    try {
      const decodedToken = await this.auth.verifyIdToken(token);
      fid = decodedToken.uid;
    } catch {
      fid = '';
    }

    return fid;
  }

  /**
   * Get a corresponding user on the entered token. Throw an error
   * if authentication failed.
   *
   * @param token ID token provided by firebase authentication.
   * @returns
   */
  async getUser(token: string) {
    const fid = await this.getFirebaseUserId(token);

    if (fid === '') {
      throw new UnauthorizedException('Invalid access token!');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        fid,
      },
    });

    if (user == null) {
      throw new InternalServerErrorException(
        'Please connect again after a while!',
      );
    }

    return user;
  }
}
