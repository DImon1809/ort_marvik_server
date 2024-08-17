import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Res,
  Req,
  Param,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ITokens } from 'src/types/tokens';
import { Response, Request } from 'express';

import { Cookie } from 'src/decorators/cookie.decorator';

const REFRESH_TOKEN = 'refreshtoken';

import { Public } from 'src/decorators/public.decorator';

import { User } from '@prisma/client';

import { UserAgent } from 'src/decorators/agent.decorator';
import { ReqUserDto } from './dto/req-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async registerUser(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Public()
  @Post('login')
  async loginUser(
    @Body() dto: LoginDto,
    @UserAgent() agent: string,
    @Res() res: Response,
  ) {
    // const userAndTokens = await this.authService.login(dto, agent);
    const tokens = await this.authService.login(dto, agent);

    return this.setRefreshAndAccessTokens(tokens, res);
  }

  @Get('/current')
  async current(@Req() req: Request) {
    const { email } = req.user as ReqUserDto;

    if (!email) throw new UnauthorizedException('Вы не авторизованы!');

    const currentUser = await this.authService.current(email);

    if (!currentUser)
      throw new UnauthorizedException('Вы не зарегистрированы!');

    return currentUser;
  }

  @Public()
  @Get('logout')
  async logout(
    @Cookie(REFRESH_TOKEN) refreshToken: string,
    @UserAgent() agent: string,
    @Res() res: Response,
  ) {
    if (!refreshToken) throw new UnauthorizedException('Вы не авторизованы!');

    await this.authService.deleteRefreshToken(refreshToken, agent);

    res.cookie(REFRESH_TOKEN, '', {
      httpOnly: true,
      secure: true,
      expires: new Date(),
    });

    return res.sendStatus(HttpStatus.OK);
  }

  @Delete('delete')
  async deleteUser(@Req() req: Request, @Res() res: Response) {
    const { id, email } = req.user as ReqUserDto;
    await this.authService.deleteUser(id, email);

    res.cookie(REFRESH_TOKEN, '', {
      httpOnly: true,
      secure: true,
      expires: new Date(),
    });

    return res.status(HttpStatus.OK).json({ message: 'Удалено!' });
  }

  private setRefreshAndAccessTokens(tokens: ITokens, res: Response) {
    if (!tokens) throw new UnauthorizedException('Вы не авторизованы!');

    res.cookie(REFRESH_TOKEN, tokens.refreshToken.token, {
      httpOnly: true,
      sameSite: 'lax',
      expires: new Date(tokens.refreshToken.expire),
      secure: false,
      path: '/',
    });

    return res
      .status(HttpStatus.ACCEPTED)
      .json({ accessToken: tokens.accessToken });
  }
}
