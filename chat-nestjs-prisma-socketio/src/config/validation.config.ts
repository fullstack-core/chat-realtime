import { ValidationPipeOptions } from '@nestjs/common';
import { ValidationOptions } from 'class-validator';
import { AppConfig } from './app.config';

export const ValidationConfig: ValidationPipeOptions & ValidationOptions =
  Object.freeze<ValidationPipeOptions & ValidationOptions>({
    whitelist: true,
    stopAtFirstError: false,
    enableDebugMessages: AppConfig.debug,
  });
