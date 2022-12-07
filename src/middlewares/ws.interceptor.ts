import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { ACTIONS, ModifyWebSocket } from 'src/interfaces/ws';

@Injectable()
export class WsErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) =>
        throwError(() => {
          const client: ModifyWebSocket = context.switchToWs().getClient();
          const error = { message: err.message || 'Unknown error', status: err.status || 500 };
          client.send(JSON.stringify({ event: ACTIONS.ERROR, data: error }));
        }),
      ),
    );
  }
}
