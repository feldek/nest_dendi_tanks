import { RequireOnlyOne } from 'src/interfaces/common';
import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { intersection } from 'lodash';
import {
  GAME_ACTIONS,
  ActionTypes,
  IWsData,
  ModifyWebSocket,
  ToType,
  IRequiredTo,
} from 'src/interfaces/ws';
import { Server } from 'ws';
import { AuthService } from 'src/controllers/auth/auth.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['*'],
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(protected authService: AuthService) {}

  @WebSocketServer()
  server: Server<ModifyWebSocket>;
  userId: number[] = [];
  gameId: number[] = [];

  protected logger: Logger = new Logger('AppGateway');

  //nest expects an object to have the format { event: string, data: {...any} }
  //it's unnecessary but recommended
  // sendToClient<P>(event: ActionTypes, message: RequiredField<IWsData<P, ToType>, 'to'>) {
  sendToClient<P>(event: ActionTypes, message: IRequiredTo<P, ToType>) {
    const listWsClients = Array.from(this.server.clients);
    let userTarget: ModifyWebSocket[] = listWsClients;

    if (!message.to.broadcast) {
      userTarget = Object.entries(message.to)
        // targetName - one of key at field message.to: { userId, group, broadcast }
        .map(([targetName, targetValue]) =>
          listWsClients.filter((user) => {
            const currentUserTarget = Array.isArray(user[targetName])
              ? user[targetName]
              : [user[targetName]];

            const currentTargetValue = Array.isArray(targetValue) ? targetValue : [targetValue];
            return intersection(currentUserTarget, currentTargetValue).length;
          }),
        )
        .flat();
    }

    userTarget.forEach((user) => {
      user.send(JSON.stringify(WsGateway.generateResponse<P>(event, message)));
    });
  }

  static generateResponse<T>(
    event: ActionTypes,
    data: IWsData<T, ToType>,
  ): { event: ActionTypes; data: IWsData<T, ToType> } {
    return { event, data };
  }

  getWsClients(
    data: RequireOnlyOne<{ userId: number[] | number; gameId: number }, 'userId' | 'gameId'>,
  ) {
    const listWsClients = Array.from(this.server.clients);
    if (data.userId && Array.isArray(data.userId)) {
      return listWsClients.filter((client) => client.userId === data.userId);
    } else if (data.userId) {
      return [listWsClients.find((client) => client.userId === data.userId)];
    } else if (data.gameId) {
      return listWsClients.filter((client) => client.gameId === data.gameId);
    }
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: ModifyWebSocket) {
    this.userId = this.userId.filter((userId) => userId !== client.userId);
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  async handleConnection(client: ModifyWebSocket, ...args: any[]) {
    client.isGameHost = false;

    this.logger.log(`New client connected`);

    // const message = JSON.stringify(
    //   this.generateResponse(ACTIONS.CONNECTION, {
    //     payload: { message: `Hello user ${clientId}` },
    //     uuid: uuidv4(),
    //   }),
    // );
    // client.send(message);
  }

  static sendError<T = {}>(
    client: ModifyWebSocket,
    data: { message: string; status?: number } & T,
  ) {
    client.send(
      JSON.stringify({
        event: GAME_ACTIONS.ERROR,
        data: { message: data.message, status: data.status || 400 },
      }),
    );
  }
}
