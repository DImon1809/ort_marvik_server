import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { options } from './config/options';
import { JwtAuthGuard } from './strategy/jwt-auth-guard';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, UserService, JwtAuthGuard, JwtStrategy],
  imports: [PassportModule, JwtModule.registerAsync(options())],
})
export class AuthModule {}
