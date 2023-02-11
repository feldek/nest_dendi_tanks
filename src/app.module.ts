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
import { WSModule } from './ws/controller/ws.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { GlobalModule } from './utils/global-modules/global.module';

@Module({
  controllers: [],
  providers: [],
  imports: [
    GlobalModule,
    WSModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env`,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      schema: process.env.DB_SCHEMA,
      models: [UserEntity, RoleEntity, UserRolesEntity],
      // logging: true,
    }),
    RedisModule.forRoot({
      config: [
        {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          namespace: REDIS_NAMESPACE.PUBLISH,
        },

        {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
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
