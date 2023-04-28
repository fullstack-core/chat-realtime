import { User } from '@prisma/client';
import { ListenEvent } from './enum/event.enum';

declare module 'socket.io' {
  class Socket {
    userId?: number;
    eventName?: ListenEvent;
  }
}

declare module 'fastify' {
  export class FastifyRequest {
    user?: User;
  }
}
