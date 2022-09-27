import { RoleEntity } from './roles.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class RolesService {
  constructor(@InjectModel(RoleEntity) private roleRepository: typeof RoleEntity) {}

  async create(params: CreateRoleDto) {
    const role = await this.roleRepository.create(params);
    return role;
  }

  async getRole({ role }: { role: string }) {
    const returnRole = await this.roleRepository.findOne({ where: { value: role } });
    return returnRole;
  }
}
