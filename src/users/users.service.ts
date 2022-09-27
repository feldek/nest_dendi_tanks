import { RoleEntity } from './../roles/roles.model';
import { RolesService } from './../roles/roles.service';
import { UserEntity } from './users.model';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-users.dto';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserEntity) private userRepository: typeof UserEntity,
    private rolesService: RolesService,
  ) {}

  async createUser(params: CreateUserDto) {
    const user = await this.userRepository.create(params);
    const role = await this.rolesService.getRole({ role: 'user' });
    await user.$set('roles', [role.id]);
    return user;
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
}
