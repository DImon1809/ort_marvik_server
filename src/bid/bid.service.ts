import {
  Injectable,
  Logger,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { sendMail } from 'src/nodemailer/send-mail';

import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BidService {
  private readonly logger = new Logger();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async addBid(id: string) {
    const currentUser: Partial<User> = await this.prismaService.user
      .findUnique({ where: { id } })
      .catch((err) => {
        this.logger.error(err);

        return null;
      });

    if (!currentUser)
      throw new ForbiddenException('Пользователя не существует!');

    if (currentUser.isBid)
      throw new ConflictException('Заявка уже отправлена!');

    await sendMail(
      false,
      currentUser.email,
      currentUser.userName,
      this.configService.get('EMAIL_PASS'),
    ).catch((err) => {
      this.logger.error(err);

      return null;
    });

    return await this.prismaService.user
      .update({
        where: { id },
        data: { isBid: true },
      })
      .catch((err) => {
        this.logger.error(err);

        return null;
      });
  }
}
