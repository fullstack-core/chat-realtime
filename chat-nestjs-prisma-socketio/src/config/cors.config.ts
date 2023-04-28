import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const CORSConfig: CorsOptions = {
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true,
};
