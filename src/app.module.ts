import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleEntity } from 'src/models/roles.model';
import { UserEntity } from 'src/models/users.model';
import { UserRolesEntity } from 'src/models/user-roles.model';
import { UsersModule } from 'src/controllers/users/users.module';
import { RolesModule } from 'src/controllers/roles/roles.module';
import { AuthModule } from 'src/controllers/auth/auth.module';

@Module({
  controllers: [],
  providers: [],
  imports: [
    ConfigModule.forRoot({ envFilePath: `.env` }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      schema: process.env.DB_SCHEMA,
      models: [UserEntity, RoleEntity, UserRolesEntity],
      pool: {
        max: 20,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
      // logging: true,
    }),
    UsersModule,
    RolesModule,
    AuthModule,
  ],
})
export class AppModule {
  //example middleware
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(RolesMiddleware).forRoutes('roles');
  // }
}
