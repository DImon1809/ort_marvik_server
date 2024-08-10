import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';

import { UserDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async save(@Body() dto: UserDto) {
    return await this.userService.save(dto);
  }

  @Get(':idOrEmail')
  async find(@Param('id') id: string) {
    return await this.userService.find(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }
}
