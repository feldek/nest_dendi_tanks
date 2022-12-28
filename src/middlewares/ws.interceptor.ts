import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import {
  ActionTypes,
  ModifyWebSocket,
  GAME_ACTIONS,
  SERVER_ACTIONS,
  CLIENT_ACTIONS,
  IWsData,
} from 'src/interfaces/ws';

export type WsErrorEventTypes = GAME_ACTIONS.ERROR | SERVER_ACTIONS.ERROR | CLIENT_ACTIONS.ERROR;

export type WsErrorType<T = {}> = { event: ActionTypes } & IWsData<
  { message: string; status?: number } & T
>;

@Injectable()
export class WsErrorInterceptor implements NestInterceptor {
  constructor(public action: any) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          const event = Reflect.getMetadata(
            'message',
            (context.switchToWs() as any).handler,
          ) as ActionTypes;
          const client: ModifyWebSocket = context.switchToWs().getClient();
          const payload = context.switchToWs().getData();

          const error = {
            event,
            payload: { message: err.message || 'Unknown error', status: err.status || 500 },
            uuid: payload?.uuid,
          };

          client.sendError(error);
        }),
      ),
    );
  }
}
