import { ROLES } from 'src/constants';
import { RequireOnlyOne } from './../../interfaces/common';
import { RoleEntity } from '../../models/roles.model';
import { CreateRoleDto } from './dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';

@Injectable()
export class RolesService {
  constructor(@InjectModel(RoleEntity) private roleRepository: typeof RoleEntity) {}

  async create(params: CreateRoleDto) {
    const role = await this.roleRepository.create(params);
    return role;
  }

  async getRole({ role }: { role: string }, transaction?: Transaction) {
    const returnRole = await this.roleRepository.findOne({ where: { value: role }, transaction });
    return returnRole;
  }

  async deleteRole(params: RequireOnlyOne<{ id: number; value: string }, 'id' | 'value'>) {
    return await this.roleRepository.destroy({ where: params });
  }

  async getIdByName(roles: ROLES[]) {
    const rolesEntity = await RoleEntity.findAll({
      where: {
        value: roles,
      },
    });
    const roleIds = rolesEntity.map((item) => item.get({ plain: true }).id);

    return roleIds;
  }
}
