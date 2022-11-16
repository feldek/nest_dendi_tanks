import { UserRolesEntity } from '../../models/user-roles.model';
import { RolesModule } from './../roles/roles.module';
import { RoleEntity } from '../../models/roles.model';
import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserEntity } from '../../models/users.model';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    SequelizeModule.forFeature([UserEntity, UserRolesEntity, RoleEntity]),
    RolesModule,
    forwardRef(() => AuthModule),
  ],
  exports: [UsersService],
})
export class UsersModule {}
