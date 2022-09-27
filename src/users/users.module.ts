import { UserRolesEntity } from './../roles/user-roles.model';
import { RolesModule } from './../roles/roles.module';
import { RoleEntity } from './../roles/roles.model';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserEntity } from './users.model';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    SequelizeModule.forFeature([UserEntity, RoleEntity, UserRolesEntity]),
    RolesModule,
  ],
})
export class UsersModule {}
