import { serverActions, IServerAction } from './gateway/actions/server-actions';
import { gameActions, IGameAction } from './gateway/actions/game-actions.class';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { MessageBody } from '@nestjs/websockets';
import { ROLES } from 'src/constants';
import { REDIS_ACTION, REDIS_NAMESPACE } from 'src/constants/redis.constants';
import {
  ActionTypes,
  IWsData,
  GAME_ACTIONS,
  ModifyWebSocket,
  ToType,
  SERVER_ACTIONS,
  ISchema,
  CLIENT_ACTIONS,
} from 'src/interfaces/ws';
import { WsRouterDecorators } from 'src/middlewares';
import { WsGateway } from 'src/ws/gateway/ws.gateway';
import { maps } from './game/map/maps.constants';
import Redis from 'ioredis';
import { AuthService } from 'src/controllers/auth/auth.service';
import { clientActions } from './gateway/actions/client-actions';
import { WsErrorEventTypes } from 'src/middlewares/ws.interceptor';

export class WsController extends WsGateway {
  constructor(
    @InjectRedis(REDIS_NAMESPACE.SUBSCRIBE) private readonly redisSub: Redis,
    @InjectRedis(REDIS_NAMESPACE.PUBLISH) private readonly redisPub: Redis,
    protected authService: AuthService,
  ) {
    super(authService);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_GAME);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_SERVER);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_CLIENT);

    this.redisSub.on('message', (channel: REDIS_ACTION, message) => {
      const { event, data } = JSON.parse(message) as { event: ActionTypes; data: IWsData<any> };

      if (channel === REDIS_ACTION.PROPAGATE_CLIENT) {
        if (!data?.to) {
          console.error('to - required parameter', message);
          return;
        }

        //check existing receiver target on this server (gameId, userId)
        //right now you can set only one receiver
        const targetName = Object.keys(data.to)[0] as 'userId' | 'gameId';
        if (!this[targetName][data.to[targetName]]) {
          return;
        }

        if (!clientActions[event]) {
          throw Error(`Action name = ${event} does not exist. Message: ${message}`);
        }

        clientActions[event](this, data);
        return;
      } else if (channel === REDIS_ACTION.PROPAGATE_GAME) {
        if (!data?.to.gameId) {
          console.error('to.gameId -required parameter');
          return;
        }
        //skip, if unnecessary node instance
        if (!gameActions[data.to.gameId]) {
          return;
        }

        if (!gameActions[event]) {
          throw Error(`Action name = ${event} does not exist. Message: ${message}`);
        }

        gameActions[event](this, data);
      } else if (channel === REDIS_ACTION.PROPAGATE_SERVER) {
        if (!data?.to.gameId) {
          console.error('to.gameId - required parameter');
          return;
        }

        if (!serverActions[event]) {
          throw Error(`Action name = ${event} does not exist. Message: ${message}`);
        }

        serverActions[event](this, data);
      }
    });

    this.redisSub.on('error', (err) => {
      console.log('redisSub ERROR', err);
    });
  }

  propagateServerEvent<T extends IWsData<any, ToType>>(event: SERVER_ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_SERVER, JSON.stringify({ event, data }));
  }

  propagateGameEvent<T extends IWsData<any>>(event: GAME_ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_GAME, JSON.stringify({ event, data }));
  }

  propagateClientEvent<T extends IWsData<any, ToType>>(event: CLIENT_ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_CLIENT, JSON.stringify({ event, data }));
  }

  propagateClientError<T extends IWsData<any, ToType> & { event: ActionTypes }>(
    event: WsErrorEventTypes,
    data: T,
  ) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_CLIENT, JSON.stringify({ event, data }));
  }

  @WsRouterDecorators(GAME_ACTIONS.TEST)
  handleMessage(
    client: ModifyWebSocket,
    @MessageBody() message: IWsData<ISchema[GAME_ACTIONS.TEST]>,
  ) {
    // message.to = { broadcast: true };
    // this.propagateMessage(ACTIONS.TEST, message);
    // this.propagateMessage(ACTIONS.JOIN_TO_GAME, message, { broadcast: true });
  }

  @WsRouterDecorators(CLIENT_ACTIONS.AUTHENTICATED, [])
  async authenticated(
    client: ModifyWebSocket,
    message: IWsData<ISchema[CLIENT_ACTIONS.AUTHENTICATED]>,
  ) {
    const { userId, userRoles } = this.authService.decodeToken<{
      userId: number;
      userRoles: ROLES[];
    }>(message.payload.token);
    client.userId = userId;
    client.userRoles = userRoles;

    this.paramUserIdAdd(userId);

    return {
      event: CLIENT_ACTIONS.AUTHENTICATED,
      data: { payload: { message: 'Authenticated successful' } },
    };
  }

  @WsRouterDecorators(CLIENT_ACTIONS.LOGOUT)
  logout(client: ModifyWebSocket) {
    this.paramUserIdDelete(client.userId);

    client.userId = null;
    client.userRoles = [];

    return {
      event: CLIENT_ACTIONS.LOGOUT,
      data: { payload: { message: 'Logout successful' } },
    };
  }

  @WsRouterDecorators(GAME_ACTIONS.CREATE_NEW_GAME)
  newGame(client: ModifyWebSocket, message: IWsData<ISchema[GAME_ACTIONS.CREATE_NEW_GAME]>) {
    const userId = client.userId;

    const gameId = this.getNewGameId();
    gameActions.createNewGame(
      {
        tanks: [{ ...message.payload, userId }],
        map: maps.testMap,
      },
      gameId,
    );

    client.gameId = gameId;
    client.isGameHost = true;

    this.gameId[gameId] = gameId;

    this.propagateServerEvent<IServerAction[SERVER_ACTIONS.CREATE_NEW_GAME]>(
      SERVER_ACTIONS.CREATE_NEW_GAME,
      {
        to: { gameId },
        payload: { userId },
      },
    );

    return WsGateway.generateResponse(GAME_ACTIONS.CREATE_NEW_GAME, {
      payload: { gameId },
      uuid: message.uuid,
    });
  }

  @WsRouterDecorators(GAME_ACTIONS.JOIN_TO_GAME)
  joinToGame(client: ModifyWebSocket, message: IWsData<ISchema[GAME_ACTIONS.JOIN_TO_GAME]>) {
    const gameId = message.payload.gameId;
    const userId = client.userId;

    const game = this.getGameById(gameId);

    if (!game) {
      client.sendError({
        event: GAME_ACTIONS.JOIN_TO_GAME,
        payload: {
          message: `Game with id = ${gameId} not found`,
        },
        uuid: message.uuid,
      });

      return;
    } else if (game.started) {
      client.sendError({
        event: GAME_ACTIONS.JOIN_TO_GAME,
        payload: {
          message: `Game with id = ${gameId} already started`,
        },
        uuid: message.uuid,
      });

      return;
    }

    message.from = { userId: client.userId };
    message.to = { gameId };

    this.gameId[gameId] = gameId;

    this.propagateGameEvent<IGameAction[GAME_ACTIONS.JOIN_TO_GAME]>(
      GAME_ACTIONS.JOIN_TO_GAME,
      message as IGameAction[GAME_ACTIONS.JOIN_TO_GAME],
    );

    this.propagateServerEvent<IServerAction[SERVER_ACTIONS.JOIN_TO_GAME]>(
      SERVER_ACTIONS.JOIN_TO_GAME,
      {
        to: { gameId },
        payload: { userId },
      },
    );
  }

  @WsRouterDecorators(GAME_ACTIONS.START_GAME)
  startGame(client: ModifyWebSocket) {
    if (!client.isGameHost) {
      return {
        event: GAME_ACTIONS.ERROR,
        data: { message: 'Start game should only host' },
      };
    }
    const gameId = client.gameId;
    const game = gameActions[gameId];

    game.startGame(this.propagateClientEvent.bind(this), this.propagateServerEvent.bind(this));
    this.propagateServerEvent<IServerAction[SERVER_ACTIONS.START_GAME]>(SERVER_ACTIONS.START_GAME, {
      to: { gameId },
    });
  }

  @WsRouterDecorators(GAME_ACTIONS.GET_NOT_STARTED_GAMES)
  getNotStartedGamesController() {
    const notStartedGameId = this.getNotStartedGames();

    return {
      event: GAME_ACTIONS.GET_NOT_STARTED_GAMES,
      data: { payload: { gameIds: notStartedGameId } },
    };
  }

  @WsRouterDecorators(GAME_ACTIONS.PAUSE_GAME)
  pauseGame(client: ModifyWebSocket, message: IWsData<ISchema[GAME_ACTIONS.PAUSE_GAME]>) {
    const pause = message.payload.pause;
    this.propagateGameEvent<IGameAction[GAME_ACTIONS.PAUSE_GAME]>(GAME_ACTIONS.PAUSE_GAME, {
      to: { gameId: client.gameId },
      payload: { pause },
    });
  }

  @WsRouterDecorators(GAME_ACTIONS.FORCE_END_GAME, ROLES.ADMIN)
  endGame(@MessageBody() message: IWsData<ISchema[GAME_ACTIONS.FORCE_END_GAME]>) {
    const game = gameActions[message.payload.gameId];
    game.endGame();
  }

  @WsRouterDecorators(GAME_ACTIONS.TANK_MOVEMENT)
  tankMovement(client: ModifyWebSocket, message: IWsData<ISchema[GAME_ACTIONS.TANK_MOVEMENT]>) {
    const { userId, gameId } = client;

    message.to = { gameId };
    message.from = { userId };

    this.propagateGameEvent<IGameAction[GAME_ACTIONS.TANK_MOVEMENT]>(
      GAME_ACTIONS.TANK_MOVEMENT,
      message as IGameAction[GAME_ACTIONS.TANK_MOVEMENT],
    );
  }

  @WsRouterDecorators(GAME_ACTIONS.TANK_SHOT)
  tankShot(client: ModifyWebSocket) {
    const { userId, gameId } = client;

    this.propagateGameEvent<IGameAction[GAME_ACTIONS.TANK_SHOT]>(GAME_ACTIONS.TANK_SHOT, {
      to: { gameId },
      from: { userId },
    });
  }
}
