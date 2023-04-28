import Redis from 'ioredis';
import { RedisConfig } from 'src/config';

const client = new Redis(RedisConfig);

export const RedisClient =
  () => (target: unknown, propertyKey: string | symbol) => {
    target[propertyKey] = client;
  };
