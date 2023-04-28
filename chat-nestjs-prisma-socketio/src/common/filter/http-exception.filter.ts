import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ErrorMessage } from 'src/type';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const status = exception.getStatus();
    let message: ErrorMessage;

    if (exception instanceof BadRequestException) {
      message = (exception.getResponse() as Error).message;
    } else {
      message = exception.message;
    }

    response.code(status).send({
      statusCode: status,
      message,
    });
  }
}
