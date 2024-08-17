import {
  Injectable,
  Logger,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

import { v4 } from 'uuid';
import { add } from 'date-fns';

import { compareSync } from 'bcrypt';
import { ITokens } from 'src/types/tokens';

import * as nodeMailer from 'nodemailer';
import { patternMessage } from 'src/patterns/pattern-message';

@Injectable()
export class AuthService {
  private readonly logger = new Logger();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  public async register(dto: RegisterDto) {
    const checkUser = await this.userService.find(dto.email).catch((err) => {
      this.logger.error(err);

      return null;
    });

    if (checkUser) throw new ConflictException('Пользователь уже существует!');

    // await this.sendMail(dto.email, 'Завершить регистрацию');

    return await this.userService.save(dto);
  }

  public async login(dto: LoginDto, agent: string): Promise<ITokens> {
    // : Promise<{
    //   user: Partial<User>;
    //   tokens: ITokens;
    // }> {

    const currentUser: Partial<User> = await this.userService
      .find(dto.email)
      .catch((err) => {
        this.logger.error(err);

        return null;
      });

    if (!currentUser || !compareSync(dto.password, currentUser.password))
      throw new ForbiddenException('Неверный логин или пароль!');

    const { id, userName, email, isBid } = currentUser;

    const tokens = await this.generateTokens(id, email, agent).catch((err) => {
      this.logger.error(err);

      return null;
    });

    // return {
    //   user: {
    //     userName,
    //     email,
    //     isBid,
    //   },
    //   tokens,
    // };

    return tokens;
  }

  public async current(
    email: string,
  ): Promise<{ userName: string; email: string; isBid: boolean }> {
    const currentUser: Partial<User> = await this.userService
      .find(email)
      .catch((err) => {
        this.logger.error(err);

        return null;
      });

    return {
      userName: currentUser.userName,
      email: currentUser.email,
      isBid: currentUser.isBid,
    };
  }

  public async deleteUser(id: string, email: string) {
    const checkUser = await this.userService.find(email).catch((err) => {
      this.logger.error(err);

      return null;
    });

    if (!checkUser) throw new ForbiddenException('Пользователя не существует!');

    await this.prismaService.token.deleteMany({
      where: {
        ownerId: id,
      },
    });
    return await this.userService.delete(email);
  }

  public async deleteRefreshToken(refreshtoken: string, agent: string) {
    await this.prismaService.token
      .delete({ where: { token: refreshtoken, agent } })
      .catch((err) => {
        this.logger.error(err);

        return null;
      });
  }

  private async genRefreshToken(ownerId: string, agent: string) {
    const token = await this.prismaService.token.findFirst({
      where: { ownerId, agent },
    });

    if (!token)
      return await this.prismaService.token.create({
        data: {
          token: v4(),
          expire: add(new Date(), { months: 1 }),
          agent,
          ownerId,
        },
      });

    if (token)
      return await this.prismaService.token.update({
        where: {
          id: token.id,
        },

        data: {
          token: v4(),
          expire: add(new Date(), { months: 1 }),
        },
      });
  }

  private async generateTokens(
    id: string,
    email: string,
    agent: string,
  ): Promise<ITokens> {
    const accessToken = this.jwtService.sign({
      id,
      email,
    });

    const refreshToken = await this.genRefreshToken(id, agent);

    return { accessToken, refreshToken };
  }

  private async sendMail(email: string, subject: string) {
    const transporter = nodeMailer.createTransport(
      {
        host: 'smtp.mail.ru',
        port: 465,
        secure: true,
        auth: {
          user: 'ort.marvic@yandex.ru',
          pass: '32119',
        },
      },
      {
        from: 'Не требует ответа. Сообщение от <ort.marvic@yandex.ru>',
      },
    );

    const mailer = (message: { to: string; subject: string; html: string }) =>
      transporter.sendMail(message, (err) => {
        if (err) this.logger.error(err);
      });

    mailer(patternMessage(email, subject));
  }
}
