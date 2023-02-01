import { WsLoadFileActions } from '../actions/load-file-test/handler';
import { WsGamesState } from './ws.games-state';
import { RequiredField } from 'src/interfaces/common';
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
  sendToClient<P>(event: ActionTypes, data: IRequiredTo<P, ToType>) {
    const userTarget: ModifyWebSocket[] = this.getWsClients(data.to);

    userTarget.forEach((user) => {
      // @ts-ignore
      user.send(JSON.stringify(this.generateResponse<P, ToType>(event, data)));
    });
  }

  //TODO: { message: string } | unknown define how unknown, need { message: string } also
  sendErrorToClient(event: ActionTypes, data: IRequiredTo<{ message: string } | unknown, ToType>) {
    const { payload } = data;
    const userTarget: ModifyWebSocket[] = this.getWsClients(data.to);
    const message =
      payload instanceof Error
        ? { message: payload.message, name: payload.name }
        : {
            //@ts-ignore
            message: payload.message || 'Unknown Error',
          };

    userTarget.forEach((user) => {
      user.send(
        JSON.stringify(
          this.generateResponse<{ message: string; name?: string }, ToType>(ACTIONS.ERROR, {
            ...data,
            event,
            payload: message,
          }),
        ),
      );
    });
  }

  generateResponse<P, T extends ToType>(
    event: ActionTypes,
    data: IWsData<P, T> & { event?: ACTIONS },
  ) {
    return { event, data };
  }

  getWsClients(data: ToType): ModifyWebSocket[] {
    const listWsClients = Array.from(this.server.clients);
    let findWsClients: ModifyWebSocket[] = [];

    if (data.gameId) {
      findWsClients = listWsClients.filter((client) => client.gameId === data.gameId);
    } else if (data.userId) {
      const client = listWsClients.find((client) => client.userId === data.userId);
      findWsClients = client ? [client] : [];
    } else if (data.userIds && Array.isArray(data.userIds)) {
      findWsClients = listWsClients.filter((client) => data.userIds.includes(client.gameId));
    } else if (data.broadcast) {
      findWsClients = listWsClients;
    } else if (data.groups && Array.isArray(data.groups)) {
      findWsClients = listWsClients.filter((client) => intersection(data.groups, client.groups));
    }

    return findWsClients;
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
