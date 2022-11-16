import { forwardRef, Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserRolesEntity } from '../../models/user-roles.model';
import { UserEntity } from 'src/models/users.model';
import { RoleEntity } from 'src/models/roles.model';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [RolesService],
  controllers: [RolesController],
  imports: [
    SequelizeModule.forFeature([RoleEntity, UserEntity, UserRolesEntity]),
    forwardRef(() => AuthModule),
  ],
  exports: [RolesService],
})
export class RolesModule {}
