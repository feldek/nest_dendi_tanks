import { applyDecorators, UseInterceptors, UsePipes } from '@nestjs/common';
import { joiSchema } from 'src/ws/controller/schema';
import { WsErrorInterceptor } from './ws.interceptor';
import { SubscribeMessage } from '@nestjs/websockets';
import { JoiValidationPipe } from './ws-joi.pipe';
import { WsRoleGuard } from './ws-roles.guard';
import { ROLES } from 'src/constants';
import { ACTIONS } from 'src/constants/actions.constants';

export const WsRouterDecorators = (action: ACTIONS, roles: ROLES | ROLES[] = ROLES.USER) => {
  const existSchema = joiSchema[action] ? [UsePipes(new JoiValidationPipe(joiSchema[action]))] : [];
  const addRoleGuard = roles.length !== 0 ? [WsRoleGuard(roles)] : [];

  return applyDecorators(
    ...existSchema,
    ...addRoleGuard,
    UseInterceptors(new WsErrorInterceptor(action)),
    SubscribeMessage(action),
  );
};
