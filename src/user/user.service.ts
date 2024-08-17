import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { hashSync, genSaltSync } from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';

import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async save(dto: UserDto) {
    const checkUser = await this.prismaService.user
      .findFirst({
        where: {
          email: dto.email,
        },
      })
      .catch((err) => {
        this.logger.error(err);

        return null;
      });

    if (checkUser)
      throw new BadRequestException('Пользователь с таким е-маил уже есть!');

    const hashedPassword = hashSync(dto.password, genSaltSync(10));

    return await this.prismaService.user
      .create({
        data: {
          userName: dto.userName,
          email: dto.email,
          password: hashedPassword,
          isBid: false,
        },
      })
      .catch((err) => {
        this.logger.error(err);

        return null;
      });
  }

  async find(idOrEmail: string) {
    return await this.prismaService.user.findUnique({
      where: {
        email: idOrEmail,
      },
    });
  }

  async delete(email: string) {
    return await this.prismaService.user.delete({
      where: { email },
    });
  }
}
