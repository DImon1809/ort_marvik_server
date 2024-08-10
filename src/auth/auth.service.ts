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

    return await this.userService.save(dto);
  }

  public async login(dto: LoginDto): Promise<ITokens> {
    const currentUser: Partial<User> = await this.userService
      .find(dto.email)
      .catch((err) => {
        this.logger.error(err);

        return null;
      });

    if (!currentUser || !compareSync(dto.password, currentUser.password))
      throw new ForbiddenException('Неверный логин или пароль!');

    return await this.generateTokens(currentUser).catch((err) => {
      this.logger.error(err);

      return null;
    });
  }

  public async deleteRefreshToken(refreshtoken: string) {
    await this.prismaService.token
      .delete({ where: { token: refreshtoken } })
      .catch((err) => {
        this.logger.error(err);

        return null;
      });
  }

  private async genRefreshToken(ownerId: string) {
    const token = await this.prismaService.token.findFirst({
      where: { ownerId },
    });

    if (!token)
      return await this.prismaService.token.create({
        data: {
          token: v4(),
          expire: add(new Date(), { months: 1 }),
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

  private async generateTokens(currentUser: Partial<User>): Promise<ITokens> {
    const accessToken = this.jwtService.sign({
      id: currentUser.id,
      email: currentUser.email,
    });

    const refreshToken = await this.genRefreshToken(currentUser.id);

    return { accessToken, refreshToken };
  }
}
