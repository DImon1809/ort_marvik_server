import { JwtModuleAsyncOptions, JwtModuleOptions } from '@nestjs/jwt';

import { ConfigService } from '@nestjs/config';

const getConfig = (config: ConfigService): JwtModuleOptions => ({
  secret: config.get('SECRET_KEY'),
  signOptions: {
    expiresIn: config.get('JWT_EXPIRE'),
  },
});

export const options = (): JwtModuleAsyncOptions => ({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => getConfig(config),
});
