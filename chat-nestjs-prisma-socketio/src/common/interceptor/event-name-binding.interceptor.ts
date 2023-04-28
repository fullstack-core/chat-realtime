import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { ListenEvent } from 'src/enum';

@Injectable()
export class EventNameBindingInterceptor implements NestInterceptor {
  constructor(private readonly eventName: ListenEvent) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const client = context.switchToWs().getClient() as Socket;
    client.eventName = this.eventName;

    return next.handle();
  }
}
