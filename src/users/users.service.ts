import { UserEntity } from './users.model';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-users.dto';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class UsersService {
  constructor(@InjectModel(UserEntity) private userRepository: typeof UserEntity) {}

  async createUser(params: CreateUserDto) {
    const user = await this.userRepository.create(params);
    return user;
  }

  async getAllUsers({ limit = 10, offset = 0 }: { limit?: number; offset?: number }) {
    const users = await this.userRepository.findAll({ limit, offset });
    return users;
  }
}
