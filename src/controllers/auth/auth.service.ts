import { ROLES } from 'src/constants';
import { Injectable, HttpException, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-users.dto';
import { UsersService } from '../users/users.service';
import bcrypt from 'bcryptjs';
import { Transaction } from 'sequelize';

@Injectable()
export class AuthService {
  constructor(private userService: UsersService, private jwtService: JwtService) {}

  async signIn(userDto: CreateUserDto, transaction: Transaction) {
    await this.validateUser(userDto, transaction);
    const user = await this.userService.getUserRoles({ email: userDto.email }, transaction);

    return this.generateToken({ userId: user.id, userRoles: user.roles });
  }

  async signUp(userDto: CreateUserDto, transaction?: Transaction) {
    const existingUser = await this.userService.getUserByEmail(userDto.email, transaction);
    if (existingUser) {
      throw new HttpException(`User with email=${userDto.email} exist`, 400);
    }

    const hashPassword = await bcrypt.hash(userDto.password, 6);
    const { user, role } = await this.userService.createUser(
      {
        ...userDto,
        password: hashPassword,
      },
      ROLES.USER,
      transaction,
    );
    const token = this.generateToken({ userId: user.id, userRoles: [role] });
    return token;
  }

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

  private async validateUser(userDto: CreateUserDto, transaction: Transaction) {
    const user = await this.userService.getUserByEmail(userDto.email, transaction);

    if (!user) {
      throw new HttpException('This user does not exist', 500);
    }

    const passwordEquals = await bcrypt.compare(userDto.password, user.password);
    if (user && passwordEquals) {
      return user;
    }
    throw new UnauthorizedException({ message: 'Wrong email or password' });
  }

  async createHash(target: string) {
    return await bcrypt.hash(target, 6);
  }
}
