import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    forwardRef(() => UsersModule),
    JwtModule.register({
      secret: process.env.ACCESS_PRIVATE_KEY,
      signOptions: {
        expiresIn: '3h',
      },
    }),
  ],

  exports: [AuthService, JwtModule],
})
export class AuthModule {}
