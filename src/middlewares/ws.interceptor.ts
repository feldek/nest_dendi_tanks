import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { GAME_ACTIONS, ModifyWebSocket } from 'src/interfaces/ws';

@Injectable()
export class WsErrorInterceptor implements NestInterceptor {
  constructor(public action: any) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          const client: ModifyWebSocket = context.switchToWs().getClient();
          const payload = context.switchToWs().getData();
          const error = { message: err.message || 'Unknown error', status: err.status || 500 };
          client.send(JSON.stringify({ event: GAME_ACTIONS.ERROR, data: error, payload }));
        }),
      ),
    );
  }
}
