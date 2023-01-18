import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserRolesEntity } from '../../models/user_roles.model';
import { UserEntity } from 'src/models/users.model';
import { RoleEntity } from 'src/models/roles.model';

@Module({
  providers: [RolesService],
  controllers: [RolesController],
  imports: [SequelizeModule.forFeature([RoleEntity, UserEntity, UserRolesEntity])],
  exports: [RolesService],
})
export class RolesModule {}
