import { CreateRoleDto } from './dto/create-role.dto';
import { RolesService } from './roles.service';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';

@Controller('roles')
export class RolesController {
  constructor(private roleService: RolesService) {}

  @Post()
  create(@Body() params: CreateRoleDto) {
    return this.roleService.create(params);
  }

  @Get('/:role')
  getByValue(@Param('role') role: string) {
    return this.roleService.getRole({ role });
  }
}
