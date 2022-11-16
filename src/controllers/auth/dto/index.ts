import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignInResDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE2LCJ1c2VyUm9sZXMiOlsidXNlciJdLCJpYXQiOjE2NjgxMjEyNDMsImV4cCI6MTY2ODEzMjA0M30.EmMc2QNH9Kx4CdCs8-Bh-w9eyM_O_INObsdZNkekPLw',
    description: 'Assess token for validations',
  })
  @IsString({ message: 'Should be string' })
  readonly token: string;
}
