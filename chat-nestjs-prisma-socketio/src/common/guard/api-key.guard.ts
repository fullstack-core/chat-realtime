import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import * as aes256 from 'aes256';
import { AppConfig } from 'src/config';

const cipher = aes256.createCipher(AppConfig.secretKey);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const apiKey = request.query['apiKey'];

    if (apiKey == undefined) {
      throw new ForbiddenException('Api key is required!');
    }

    try {
      const decryptedApiKey = cipher.decrypt(apiKey);

      if (decryptedApiKey !== AppConfig.apiKey) {
        throw new ForbiddenException('Api key is invalid!');
      }
    } catch (_) {
      throw new ForbiddenException('Api key is invalid!');
    }

    return true;
  }
}
