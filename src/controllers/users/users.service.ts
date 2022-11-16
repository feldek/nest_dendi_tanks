import { RequireOnlyOne } from '../../interfaces/common';
import { UserEntity } from './../../models/users.model';
import { RoleEntity } from '../../models/roles.model';
import { RolesService } from './../roles/roles.service';
import { HttpException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-users.dto';
import { InjectModel } from '@nestjs/sequelize';
import { UserRolesEntity } from './../../models/user-roles.model';
import { ROLES } from 'src/constants';
import { Transaction } from 'sequelize';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserEntity) private userRepository: typeof UserEntity,
    @InjectModel(UserRolesEntity) private userRolesRepository: typeof UserRolesEntity,
    private rolesService: RolesService,
  ) {}

  //new user should get "user" role
  async createUser(params: CreateUserDto, role = ROLES.USER, transaction?: Transaction) {
    const [userRole, user] = await Promise.all([
      this.rolesService.getRole({ role: ROLES.USER }, transaction),
      this.userRepository.create(params, { transaction }),
    ]);

    // await user.$set('roles', [role.id]);
    await this.userRolesRepository.create(
      { userId: user.id, roleId: userRole.id },
      { transaction },
    );

    return { user, role };
  }

  async getAllUsers({ limit = 10, offset = 0 }: { limit?: number; offset?: number }) {
    const users = await this.userRepository.findAll({
      include: [
        {
          model: RoleEntity,
          through: { attributes: [] },
        },
      ],
      limit,
      offset,
    });
    return users;
  }

  async getUserByEmail(email: string, transaction: Transaction) {
    const user = await this.userRepository.findOne({ where: { email }, transaction });
    return user;
  }

  async getUserRoles(
    params: RequireOnlyOne<{ id: number; email: string }, 'id' | 'email'>,
    transaction: Transaction,
  ) {
    const userRoles = await UserEntity.findOne({
      where: { ...params },
      attributes: ['id', 'email'],
      include: [
        {
          model: RoleEntity,
          attributes: ['value'],
        },
      ],
      transaction,
    });

    if (!userRoles) {
      throw new HttpException(`User with params:${params} not found`, 400);
    }

    const roles = userRoles.roles.map(
      (item) => (item as unknown as RoleEntity).get({ plain: true }).value,
    ) as ROLES[];

    if (!roles.length) {
      throw new HttpException(`User with params:${params} not have anything permissions`, 400);
    }

    return { email: userRoles.email, id: userRoles.id, roles: roles };
  }

  async setUserRole(params: { userId: number; roles: ROLES[] }) {
    const { roles, userId } = params;
    const roleIds = await this.rolesService.getIdByName(roles);

    const bulkCreateUserRoles = roleIds.map((roleId) => ({ roleId, userId }));

    await UserRolesEntity.bulkCreate(bulkCreateUserRoles, {
      fields: ['roleId', 'userId'],
      ignoreDuplicates: true,
    });
  }

  async deleteUserRole(params: { userId: number; roles: ROLES[] }) {
    const { roles, userId } = params;
    const roleIds = await this.rolesService.getIdByName(roles);

    await this.userRolesRepository.destroy({ where: { roleId: roleIds, userId } });
  }
}
