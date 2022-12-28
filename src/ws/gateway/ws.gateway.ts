import { RequiredField, RequireOnlyOne } from 'src/interfaces/common';
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
import { WsErrorType } from 'src/middlewares/ws.interceptor';

type AllGamesValueType = { gameId: number; started: boolean; userIds: number[] };

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

  userId: { [key: number]: number } = {};

  //add gameId, when user(which belongs this node instances) did join to gameId
  gameId: { [key: number]: number } = {};
  // key = gameId
  allGames: { [key: number]: AllGamesValueType } = {};

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
      //@ts-ignore
      user.send(JSON.stringify(WsGateway.generateResponse<P>(event, message)));
    });
  }

  protected paramUserIdDelete(userId: number) {
    if (this.userId[userId]) {
      delete this.userId[userId];
    }
  }

  protected paramUserIdAdd(userId: number) {
    this.userId[userId] = userId;
  }

  getNotStartedGames() {
    return Object.values(this.allGames).filter((game) => !game.started);
  }

  getGameById(gameId: number) {
    return this.allGames[gameId];
  }

  createNewGame(gameData: AllGamesValueType) {
    this.allGames[gameData.gameId] = gameData;
  }

  addUserToGame(params: { userId: number; gameId: number }) {
    this.allGames[params.gameId].userIds.push(params.userId);
  }

  removeUserFromGame(params: { userId: number; gameId: number }) {
    const users = this.allGames[params.gameId].userIds;
    this.allGames[params.gameId].userIds = users.filter((userId) => userId !== params.userId);
  }

  launchGame(gameId: number) {
    this.allGames[gameId].started = true;
  }

  removeFromAllGames(gameId: number) {
    delete this.allGames[gameId];
  }

  protected getNewGameId() {
    const gameIds = Object.values(this.allGames).map(({ gameId }) => gameId);
    return gameIds.length ? Math.max(...gameIds) + 1 : 1;
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
    // console.log(data.userId);
    // console.log(listWsClients);

    // const test = [listWsClients.find((user) => user.userId === data.userId)];
    // console.log(test);

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
    this.paramUserIdDelete(client.userId);
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  async handleConnection(client: ModifyWebSocket, ...args: any[]) {
    client.isGameHost = false;

    this.logger.log(`New client connected`);

    client.sendError = (data) => {
      const error: { event: GAME_ACTIONS.ERROR; data: RequiredField<WsErrorType, 'payload'> } = {
        event: GAME_ACTIONS.ERROR,
        data: {
          event: data.event,
          payload: {
            message: data.payload.message || 'Unknown error',
            status: data.payload.status || 500,
          },
          uuid: data?.uuid,
        },
      };

      client.send(JSON.stringify(error));
    };

    // const message = JSON.stringify(
    //   this.generateResponse(ACTIONS.CONNECTION, {
    //     payload: { message: `Hello user ${clientId}` },
    //     uuid: uuidv4(),
    //   }),
    // );
    // client.send(message);
  }

  // static sendError<T = {}>(
  //   client: ModifyWebSocket,
  //   data: { message: string; event?: ActionTypes; status?: number } & T,
  // ) {
  //   client.send(
  //     JSON.stringify({
  //       event: GAME_ACTIONS.ERROR,
  //       data: {
  //         message: data.message,
  //         event: data.event || 'Unknown action',
  //         status: data.status || 400,
  //       },
  //     }),
  //   );
  // }
}
