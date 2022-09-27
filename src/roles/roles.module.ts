import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleEntity } from './roles.model';
import { UserEntity } from 'src/users/users.model';
import { UserRolesEntity } from './user-roles.model';

@Module({
  providers: [RolesService],
  controllers: [RolesController],
  imports: [SequelizeModule.forFeature([RoleEntity, UserEntity, UserRolesEntity])],
  exports: [RolesService],
})
export class RolesModule {}
