import { CreateUserDto } from './dto/create-users.dto';
import { UsersService } from './users.service';
import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Post()
  create(@Body() params: CreateUserDto) {
    console.log(params);
    
    return this.usersService.createUser(params);
  }

  @Get()
  getAll() {
    return this.usersService.getAllUsers({ limit: 10 });
  }
}
