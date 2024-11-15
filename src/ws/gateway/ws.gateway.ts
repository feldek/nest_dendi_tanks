import { WsLoadFileActions } from '../actions/load-file-test/handler';
import { WsGamesState } from './ws.games-state';
import { RequiredField } from 'src/interfaces/common';
import { Injectable, Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { intersection, isEmpty } from 'lodash';
import { IRequiredTo, IWsData, ModifyWebSocket, ToType } from 'src/interfaces/ws';
import { Server } from 'ws';
import { WsErrorType } from 'src/middlewares/ws.interceptor';
import { deserialize } from 'bson';
import { Redis } from 'ioredis';
import { REDIS_ACTION } from 'src/constants/redis.constants';
import { GameSessionsClass } from 'src/game/game-sessions.class';
import { HandleClient } from '../actions/client/handler';
import { HandleGame } from '../actions/game/handler';
import { HandleServer } from '../actions/server/handler';
import { ACTIONS } from '../../constants/actions.constants';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['*'],
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ModifyWebSocket>;

  protected logger: Logger = new Logger('AppGateway');

  constructor(
    readonly wsGamesState: WsGamesState,
    readonly wsLoadFileActions: WsLoadFileActions,
    readonly redisSub: Redis,
    readonly gameSessions: GameSessionsClass,
    readonly handleClient: HandleClient,
    readonly handleGame: HandleGame,
    readonly handleServer: HandleServer,
  ) {
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_GAME);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_SERVER);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_CLIENT);
    this.redisHandleActions();
  }

  //it's unnecessary but recommended
  sendToClient<P>(event: ACTIONS, data: IRequiredTo<P, ToType>) {
    const userTarget: ModifyWebSocket[] = this.getWsClients(data.to);

    userTarget.forEach((user) => {
      // @ts-ignore
      user.send(JSON.stringify(this.generateResponse<P, ToType>(event, data)));
    });
  }

  //nest expects an object to have the format { event: string, data: {...any} }

  //TODO: { message: string } | unknown define how unknown, need { message: string } also
  sendErrorToClient(event: ACTIONS, data: IRequiredTo<{ message: string } | unknown, ToType>) {
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

  generateResponse<P, T extends ToType>(event: ACTIONS, data: IWsData<P, T> & { event?: ACTIONS }) {
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

  private redisHandleActions() {
    this.redisSub.on('message', (channel: REDIS_ACTION, message) => {
      const { event, data } = JSON.parse(message) as {
        event: ACTIONS;
        data: IWsData<any, ToType>;
      };

      if (channel === REDIS_ACTION.PROPAGATE_CLIENT) {
        if (!data?.to) {
          console.error('to - required parameter', message);
          return;
        }
        //check existing receiver target on this server (gameId, userId)
        //right now you can set only one receiver

        const checkUsers = this.wsGamesState.checkExistingUser.bind(this)(data.to);

        if (!checkUsers) {
          return;
        }

        try {
          if (!this.handleClient[event]) {
            throw Error(`Action name = ${event} does not exist. Message: ${message}`);
          }

          this.handleClient[event](this, data);
          return;
        } catch (error) {
          this.sendErrorToClient(event, {
            payload: error,
            uuid: message.uuid,
            to: data.to,
          });
        }
      } else if (channel === REDIS_ACTION.PROPAGATE_GAME) {
        if (!data?.to.gameId) {
          console.error('to.gameId -required parameter');
          return;
        }
        //skip, if unnecessary node instance
        if (!this.gameSessions[data.to.gameId]) {
          return;
        }

        try {
          if (!this.handleGame[event]) {
            throw Error(`Action name = ${event} does not exist. Message: ${message}`);
          }

          this.handleGame[event](this, data);
        } catch (error) {
          this.sendErrorToClient(event, {
            payload: error,
            uuid: message.uuid,
            to: data.to,
          });
        }
      } else if (channel === REDIS_ACTION.PROPAGATE_SERVER) {
        if (!data?.to.gameId) {
          console.error('to.gameId - required parameter');
          return;
        }
        try {
          if (!this.handleServer[event]) {
            throw Error(`Action name = ${event} does not exist. Message: ${message}`);
          }

          this.handleServer[event](this, data);
        } catch (error) {
          if (isEmpty(data.to)) {
            return;
          }

          this.sendErrorToClient(event, {
            payload: error,
            uuid: message.uuid,
            to: data.to,
          });
        }
      }
    });

    this.redisSub.on('error', (err) => {
      console.log('redisSub ERROR', err);
    });
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
