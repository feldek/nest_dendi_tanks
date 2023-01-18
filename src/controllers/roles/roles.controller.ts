import { RoleEntity } from 'src/models/roles.model';
import { ROLES } from 'src/constants';
import { CreateRoleDto } from './dto';
import { RolesService } from './roles.service';
import { Body, Controller, Delete, Get, Param, Post, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from 'src/middlewares/roles.guard';

@ApiTags('Role')
@Controller('roles')
export class RolesController {
  constructor(private roleService: RolesService) {}

  @RoleGuard(ROLES.ADMIN)
  @ApiOperation({ summary: 'Create roles' })
  @ApiResponse({ status: 200, type: RoleEntity })
  @Post()
  create(@Body() params: CreateRoleDto) {
    return this.roleService.create(params);
  }

  @RoleGuard([ROLES.ADMIN, ROLES.USER])
  @ApiOperation({ summary: 'Get roles' })
  @ApiResponse({ status: 200, type: RoleEntity })
  @Get('/:role')
  getByValue(@Param('role') role: ROLES) {
    return this.roleService.getRole({ role });
  }

  @RoleGuard(ROLES.ADMIN)
  @ApiResponse({ status: 200, type: RoleEntity })
  @Delete('/:role')
  delete(@Param('role') role: ROLES) {
    return this.roleService.deleteRole({ value: role });
  }
}
