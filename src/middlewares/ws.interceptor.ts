import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { ACTIONS } from 'src/constants/actions.constants';
import { ModifyWebSocket, IWsData } from 'src/interfaces/ws';

export type WsErrorType<T = {}> = { event: ACTIONS } & IWsData<
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
          ) as ACTIONS;
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
