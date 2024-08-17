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
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ITokens } from 'src/types/tokens';
import { Response, Request } from 'express';

import { Cookie } from 'src/decorators/cookie.decorator';

const REFRESH_TOKEN = 'refreshtoken';

import { Public } from 'src/decorators/public.decorator';

import { UserAgent } from 'src/decorators/agent.decorator';
import { ReqUserDto } from './dto/req-user.dto';
import { CodeDataDto, CodeDataConfirmDto } from './dto/code-data.dto';

import { sendMail } from 'src/nodemailer/send-mail';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async registerUser(@Body() dto: RegisterDto, @Res() res: Response) {
    const message = await this.authService.register(dto);

    res.status(HttpStatus.ACCEPTED).json({ message });
  }

  @Public()
  @Post('repeat')
  async repeateCode(@Body() codeData: CodeDataDto, @Res() res: Response) {
    const { code } = await this.authService.writeCode(codeData.email);

    if (!code) throw new ForbiddenException('Невозможно получить код!');

    await sendMail(
      true,
      codeData.email,
      codeData.userName,
      this.configService.get('EMAIL_PASS'),
      code,
    );

    res.status(HttpStatus.ACCEPTED).json({ message: 'Код сгенерирован!' });
  }

  @Public()
  @Post('/code')
  async confirmCode(
    @Body() codeData: CodeDataConfirmDto,
    @Res() res: Response,
  ) {
    const message = await this.authService.confirmCode(codeData);

    if (!message) throw new ForbiddenException('Неверный код!');

    res.status(HttpStatus.CREATED).json(message);
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
      secure: true,
      path: '/',
    });

    return res
      .status(HttpStatus.ACCEPTED)
      .json({ accessToken: tokens.accessToken });
  }
}
