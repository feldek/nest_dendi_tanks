import { ROLES } from 'src/constants';
import { Injectable, HttpException } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';

import bcrypt from 'bcryptjs';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  generateToken(params: { userId: number; userRoles: ROLES[] }, jwtOptions?: JwtSignOptions) {
    return {
      access_token: this.jwtService.sign(params, {
        secret: process.env.ACCESS_PRIVATE_KEY,
        ...jwtOptions,
      }),
    };
  }

  decodeToken<T extends object = any>(token: string, jwtOptions?: JwtVerifyOptions): T {
    try {
      return this.jwtService.verify<T>(token, {
        secret: process.env.ACCESS_PRIVATE_KEY,
        ...jwtOptions,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(error.message, 401);
      }
      throw error;
    }
  }

  async createHash(target: string) {
    return await bcrypt.hash(target, 6);
  }
}
