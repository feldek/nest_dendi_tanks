import { applyDecorators, UseInterceptors, UsePipes } from '@nestjs/common';
import { ACTIONS } from 'src/interfaces/ws';
import { joiSchema } from 'src/ws/schema/intex';
import { WsErrorInterceptor } from './ws.interceptor';
import { SubscribeMessage } from '@nestjs/websockets';
import { JoiValidationPipe } from './ws-joi.pipe';

export const WsRouterDecorators = (action: ACTIONS) => {
  const existSchema = joiSchema[action] ? [UsePipes(new JoiValidationPipe(joiSchema[action]))] : [];
  return applyDecorators(
    ...existSchema,
    UseInterceptors(WsErrorInterceptor),
    SubscribeMessage(action),
  );
};
