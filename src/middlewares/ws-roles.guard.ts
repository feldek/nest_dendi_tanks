import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { intersection, isEmpty } from 'lodash';
import { Observable } from 'rxjs';
import { ROLES } from 'src/constants';
import { ActionTypes, ModifyWebSocket } from 'src/interfaces/ws';

@Injectable()
class WsRole implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<ROLES[]>('roles', context.getHandler());
    const client: ModifyWebSocket = context.switchToWs().getClient();

    const isWrongPermissions = isEmpty(intersection(client.userRoles, roles));

    if (isWrongPermissions) {
      const event = Reflect.getMetadata(
        'message',
        (context.switchToWs() as any).handler,
      ) as ActionTypes;

      const payload = context.switchToWs().getData();

      client.sendError({
        event,
        payload: {
          message: 'You do not have necessary permissions',
          status: 401,
        },
        uuid: payload?.uuid,
      });

      return false;
    }

    return true;
  }
}

export const WsRoleGuard = (role: ROLES | ROLES[]) => {
  let roles = role;
  if (typeof role === 'string') {
    roles = [role];
  }
  return applyDecorators(UseGuards(WsRole), SetMetadata('roles', roles));
};
