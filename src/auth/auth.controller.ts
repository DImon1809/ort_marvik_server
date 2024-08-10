import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ITokens } from 'src/types/tokens';
import { Response } from 'express';

import { Cookie } from 'src/decorators/cookie.decorator';

const REFRESH_TOKEN = 'refreshtoken';

import { Public } from 'src/decorators/public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async registerUser(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('login')
  async loginUser(@Body() dto: LoginDto, @Res() res) {
    const tokens = await this.authService.login(dto);

    return this.setRefreshTokenCookies(tokens, res);
  }

  @Get('logout')
  async logout(
    @Cookie(REFRESH_TOKEN) refreshToken: string,
    @Res() res: Response,
  ) {
    if (!refreshToken) throw new UnauthorizedException('Вы не авторизованы!');

    await this.authService.deleteRefreshToken(refreshToken);

    res.cookie(REFRESH_TOKEN, '', {
      httpOnly: true,
      secure: true,
      expires: new Date(),
    });

    return res.sendStatus(HttpStatus.OK);
  }

  private setRefreshTokenCookies(tokens: ITokens, res: Response) {
    if (!tokens) throw new UnauthorizedException('Вы не авторизованы!');

    res.cookie(REFRESH_TOKEN, tokens.refreshToken.token, {
      httpOnly: true,
      sameSite: 'none',
      expires: new Date(tokens.refreshToken.expire),
      secure: false,
      path: '/',
    });

    return res
      .status(HttpStatus.ACCEPTED)
      .json({ accessToken: tokens.accessToken });
  }
}
