import { WsLoadFileActions } from './../actions/load-file';
import { WsGamesState } from './ws.games-state';
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
  ACTIONS,
  ActionTypes,
  IWsData,
  ModifyWebSocket,
  ToType,
  IRequiredTo,
} from 'src/interfaces/ws';
import { Server } from 'ws';
import { WsErrorType } from 'src/middlewares/ws.interceptor';
import { deserialize } from 'bson';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['*'],
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(readonly wsGamesState: WsGamesState, readonly wsLoadFileActions: WsLoadFileActions) {}

  @WebSocketServer()
  server: Server<ModifyWebSocket>;

  protected logger: Logger = new Logger('AppGateway');

  //nest expects an object to have the format { event: string, data: {...any} }
  //it's unnecessary but recommended
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
      // @ts-ignore
      user.send(JSON.stringify(this.generateResponse<P, ToType>(event, message)));
    });
  }

  generateResponse<P, T extends ToType>(event: ActionTypes, data: IWsData<P, T>) {
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
    const { userId, gameId } = client;
    this.wsGamesState.deleteUserId(userId);

    if (gameId) {
      this.wsGamesState.deleteGameId({ gameId, userId });
    }
    this.logger.log(`Client disconnected: ${userId}`);
  }

  async handleConnection(client: ModifyWebSocket, ...args: any[]) {
    client.isGameHost = false;

    this.logger.log(`New client connected`);

    //crutch for load buffer data
    // this.listenBuffer(client);

    client.sendError = (data) => {
      const error: { event: ACTIONS.ERROR; data: RequiredField<WsErrorType, 'payload'> } = {
        event: ACTIONS.ERROR,
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

  //there is necessary for get binary data
  private listenBuffer(client: ModifyWebSocket) {
    //TODO: find possibility normal deserialize this data
    client.on('message', (data) => {
      //there we check string or bson data type(it's horrible way)

      if (!data || data.toString().slice(0, 2) === '{"') {
        return;
      }

      const deserializedData = deserialize(data as Buffer, { promoteBuffers: true });
      if (deserializedData.event === ACTIONS.LOAD_IMAGE_TEST) {
        this.wsLoadFileActions[ACTIONS.LOAD_IMAGE_TEST](client, deserializedData.data);
      }
    });
  }
}
