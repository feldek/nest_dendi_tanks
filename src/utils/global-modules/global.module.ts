import { TokenService } from './token.service';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  providers: [TokenService],
  imports: [
    JwtModule.register({
      secret: process.env.ACCESS_PRIVATE_KEY,
      signOptions: {
        expiresIn: process.env.ACCESS_EXPIRES,
      },
    }),
  ],
  exports: [TokenService],
})
export class GlobalModule {}
