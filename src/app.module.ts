import { REDIS_NAMESPACE } from 'src/constants/redis.constants';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoleEntity } from 'src/models/roles.model';
import { UserEntity } from 'src/models/users.model';
import { UserRolesEntity } from 'src/models/user_roles.model';
import { UsersModule } from 'src/controllers/users/users.module';
import { RolesModule } from 'src/controllers/roles/roles.module';
import { AuthModule } from 'src/controllers/auth/auth.module';
import { WSModule } from './ws/ws.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { GlobalModule } from './utils/global-modules/global.module';

@Module({
  controllers: [],
  providers: [],
  imports: [
    GlobalModule,
    WSModule,
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
    RedisModule.forRoot({
      config: [
        {
          host: '180.28.1.4',
          port: 6379,
          namespace: REDIS_NAMESPACE.PUBLISH,
        },

        {
          host: '180.28.1.4',
          port: 6379,
          namespace: REDIS_NAMESPACE.SUBSCRIBE,
        },
      ],
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
