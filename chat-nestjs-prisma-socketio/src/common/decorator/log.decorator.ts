import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp(),
    format.prettyPrint(),
  ),
  defaultMeta: { service: 'Communication Server' },
  transports: [
    new transports.File({
      filename: 'log/error.log',
      level: 'error',
    }),
    new transports.File({
      filename: 'log/warn.log',
      level: 'warn',
    }),
    new transports.File({
      filename: 'log/info.log',
      level: 'info',
    }),
  ],
});

export const Log = () => (target: unknown, propertyKey: string | symbol) => {
  target[propertyKey] = logger;
};
