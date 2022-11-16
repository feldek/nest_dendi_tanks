import { AuthService } from './auth.service';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-users.dto';
import { SignInResDto } from './dto';
import { Sequelize } from 'sequelize-typescript';

@ApiTags('Authorizations')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private sequelize: Sequelize) {}

  @ApiResponse({ status: 201, type: SignInResDto })
  @Post('/sign-in')
  async signIn(@Body() userDto: CreateUserDto) {
    const transaction = await this.sequelize.transaction();
    try {
      const token = await this.authService.signIn(userDto, transaction);
      await transaction.commit();
      return token;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  @ApiResponse({ status: 201, type: SignInResDto })
  @Post('/sign-up')
  async signUp(@Body() userDto: CreateUserDto) {
    const transaction = await this.sequelize.transaction();
    try {
      const token = await this.authService.signUp(userDto);
      await transaction.commit();
      return token;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
