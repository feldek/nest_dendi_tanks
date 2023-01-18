import { ROLES } from 'src/constants';
import { UserEntity } from '../../models/users.model';
import { UsersService } from './users.service';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from 'src/middlewares/roles.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @RoleGuard(ROLES.ADMIN)
  @ApiOperation({ summary: 'Get users' })
  @ApiResponse({ status: 200, type: [UserEntity] })
  @Get()
  getAll() {
    return this.usersService.getAllUsers({ limit: 10 });
  }
}
