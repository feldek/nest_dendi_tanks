import { RoleEntity } from './roles.model';
import { UserEntity } from './../users/users.model';
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

@Table({ tableName: 'user_roles', createdAt: false, updatedAt: false })
export class UserRolesEntity extends Model<UserRolesEntity> {
  @ForeignKey(() => UserEntity)
  @ApiProperty({ example: 1, description: 'user id' })
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  userId: number;

  @ForeignKey(() => RoleEntity)
  @ApiProperty({ example: 1, description: 'role id' })
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  roleId: number;
}
