import { UserEntity } from './users.model';
import { CreateUserDto } from './dto/create-users.dto';
import { UsersService } from './users.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 200, type: UserEntity })
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
