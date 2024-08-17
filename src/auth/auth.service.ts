import {
  Injectable,
  Logger,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { User, BufferKeys } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

import { v4 } from 'uuid';
import { add } from 'date-fns';

import { compareSync } from 'bcrypt';
import { ITokens } from 'src/types/tokens';

import { sendMail } from 'src/nodemailer/send-mail';
import { ConfigService } from '@nestjs/config';
import { CodeDataConfirmDto } from './dto/code-data.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async register(dto: RegisterDto) {
    const checkUser: Partial<User> = await this.userService
      .find(dto.email)
      .catch((err) => {
        this.logger.error(err);

        return null;
      });

    if (checkUser) throw new ConflictException('Пользователь уже существует!');

    const bufferKeys: Partial<BufferKeys> = await this.writeCode(dto.email);

    if (bufferKeys) {
      sendMail(
        true,
        dto.email,
        dto.userName,
        this.configService.get('EMAIL_PASS'),
        bufferKeys.code,
      );

      return 'Проверьте почту!';
    }
  }

  public async confirmCode(codeData: CodeDataConfirmDto) {
    const currentCode = await this.prismaService.bufferKeys.findFirst({
      where: { email: codeData.email },
    });

    if (currentCode.code.split(' ').join('') !== codeData.code) return false;

    await this.prismaService.bufferKeys
      .delete({ where: { email: codeData.email } })
      .catch((err) => {
        this.logger.error(err);

        return null;
      });

    return await this.userService.save(codeData);
  }

  public async login(dto: LoginDto, agent: string): Promise<ITokens> {
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

  private generateCode(): string {
    let code = [];

    for (let i = 0; i < 6; i++) {
      code[i] = `${Math.ceil(Math.random() * 10) - 1} `;
    }

    return code.join('');
  }

  public async writeCode(email: string) {
    const code = await this.prismaService.bufferKeys.findFirst({
      where: { email: email },
    });

    if (!code)
      return await this.prismaService.bufferKeys.create({
        data: {
          email,
          code: this.generateCode(),
        },
      });

    if (code)
      return await this.prismaService.bufferKeys.update({
        where: {
          email,
        },

        data: {
          code: this.generateCode(),
        },
      });
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
      return await this.prismaService.token
        .create({
          data: {
            token: v4(),
            expire: add(new Date(), { months: 1 }),
            agent,
            ownerId,
          },
        })
        .catch((err) => {
          this.logger.error(err);

          return null;
        });

    if (token)
      return await this.prismaService.token
        .update({
          where: {
            id: token.id,
          },

          data: {
            token: v4(),
            expire: add(new Date(), { months: 1 }),
          },
        })
        .catch((err) => {
          this.logger.error(err);

          return null;
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
}
