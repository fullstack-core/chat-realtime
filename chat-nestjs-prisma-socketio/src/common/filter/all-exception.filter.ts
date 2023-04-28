import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Socket } from 'socket.io';
import { AppConfig } from 'src/config';
import { Log } from 'src/common/decorator/log.decorator';
import { EmitEvent } from 'src/enum';
import { EmitEvents, LoggedError } from 'src/type';
import { Logger } from 'winston';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  @Log()
  private readonly logger: Logger;

  catch(exception: LoggedError, host: ArgumentsHost) {
    if (AppConfig.debug) {
      throw exception;
    }

    switch (host.getType()) {
      case 'ws':
        this.handleWsException(exception, host);
        break;

      case 'http':
        this.handleHttpException(exception, host);
        break;

      case 'rpc':
        break;
    }

    this.logger.error(exception);
  }

  private handleWsException(exception: LoggedError, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as Socket<null, EmitEvents>;

    exception.hostType = 'ws';
    exception.event = client.eventName;
    exception.payload = host.switchToWs().getData();

    client.emit(EmitEvent.Error, {
      event: client.eventName,
      message: 'Unknown error!',
    });
  }

  private handleHttpException(exception: LoggedError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const request = host.switchToHttp().getRequest<FastifyRequest>();

    exception.hostType = 'http';
    exception.url = request.url;
    exception.payload = request.body;

    response.code(500).send({
      statusCode: 500,
      message: 'Unknown error!',
    });
  }
}
