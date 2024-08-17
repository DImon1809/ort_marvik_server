import { Controller, Get, Req } from '@nestjs/common';
import { BidService } from './bid.service';

import { Request } from 'express';

import { ReqUserDto } from 'src/auth/dto/req-user.dto';

@Controller('bid')
export class BidController {
  constructor(private readonly bidService: BidService) {}

  @Get('add')
  async addBid(@Req() req: Request) {
    const { id } = req.user as ReqUserDto;

    return await this.bidService.addBid(id);
  }
}
