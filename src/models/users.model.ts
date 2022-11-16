import { RoleEntity } from './roles.model';
import { UserRolesEntity } from './user-roles.model';
import { BelongsToMany, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';

interface UserCreationAttrs {
  email: string;
  password: string;
}

@Table({ tableName: 'users' })
export class UserEntity extends Model<UserEntity, UserCreationAttrs> {
  @ApiProperty({ example: 1, description: 'user id' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ApiProperty({ example: 'test@gmail.com', description: "user's email" })
  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  email: string;

  @ApiProperty({ example: 'password', description: "user's password" })
  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @ApiProperty({ example: 'true', description: 'ban true/false' })
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  banned: boolean;

  @ApiProperty({ example: 'Ban description', description: 'ban reason' })
  @Column({ type: DataType.STRING })
  banReason: string;

  @HasMany(() => UserRolesEntity)
  userRoles: UserRolesEntity[];

  @BelongsToMany(() => RoleEntity, () => UserRolesEntity)
  roles: UserEntity[];
}
