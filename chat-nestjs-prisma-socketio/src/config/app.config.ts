import { env } from 'process';
import { AppEnv, Time } from 'src/enum';

export const AppConfig = Object.freeze(
  (() => {
    const parsedPort = parseInt(env.APP_PORT, 10);

    return {
      env: Object.values(AppEnv).includes(env.APP_ENV as AppEnv)
        ? env.APP_ENV
        : AppEnv.Development,
      debug: env.APP_DEBUG === 'true',
      port: parsedPort >= 0 && parsedPort < 65536 ? parsedPort : 3000,
      secretKey: env.APP_SECRET_KEY,
      apiKey: env.APP_DECRYPTED_API_KEY,
      allowJoinMultipleRooms: true,
      disconnectIfConflict: true,
      messageManagment: {
        private: {
          maxOld: 2 * Time.Day,
          cronTime: '0 0 0 * * *',
        },
        room: {
          maxOld: 7 * Time.Day,
          cronTime: '0 0 0 * * *',
        },
      },
    };
  })(),
);
