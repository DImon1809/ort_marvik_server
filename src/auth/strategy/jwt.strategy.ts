import { PassportStrategy } from '@nestjs/passport';

import { Strategy, ExtractJwt } from 'passport-jwt';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';

import { IJwtPayload } from 'src/types/tokens';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('SECRET_KEY'),
    });
  }

  async validate(payload: IJwtPayload) {
    const user = await this.prismaService.user
      .findFirst({
        where: {
          email: payload.email,
        },
      })
      .catch((err) => {
        this.logger.error(err);

        return null;
      });

    if (!user) throw new UnauthorizedException('Вы не авторизованы!');

    return payload;
  }
}
