import { UserRolesEntity } from '../../models/user_roles.model';
import { RolesModule } from './../roles/roles.module';
import { RoleEntity } from '../../models/roles.model';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserEntity } from '../../models/users.model';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [SequelizeModule.forFeature([UserEntity, UserRolesEntity, RoleEntity]), RolesModule],
  exports: [UsersService],
})
export class UsersModule {}
