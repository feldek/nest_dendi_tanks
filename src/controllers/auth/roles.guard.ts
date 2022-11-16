import { ROLES } from 'src/constants';
import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  NestMiddleware,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response, NextFunction } from 'express';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { isEmpty, intersection } from 'lodash';

//example middleware
@Injectable()
export class RolesMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // console.log(req);
    console.log('Запрос...');
    next();
  }
}

@Injectable()
export class Role implements CanActivate {
  constructor(
    private reflector: Reflector,
    // private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<ROLES[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers.access_token;
    const payload = this.authService.decodeToken<{ userId: number; userRoles: ROLES[] }>(
      accessToken,
    );
    const isWrongPermissions = isEmpty(intersection(payload.userRoles, roles));

    if (isWrongPermissions) {
      throw new HttpException('You do not have necessary permissions', 401);
    }

    request.user = { userId: payload.userId, userRoles: payload.userRoles };

    return true;
  }
}

export const RoleGuard = (role: ROLES | ROLES[]) => {
  let roles = role;
  if (typeof role === 'string') {
    roles = [role];
  }
  return applyDecorators(UseGuards(Role), SetMetadata('roles', roles));
};
