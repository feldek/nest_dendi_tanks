import { GameSessionsClass } from '../game/game-sessions.class';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { MessageBody, SubscribeMessage } from '@nestjs/websockets';
import { ROLES } from 'src/constants';
import { REDIS_ACTION, REDIS_NAMESPACE } from 'src/constants/redis.constants';
import { ActionTypes, IWsData, ACTIONS, ModifyWebSocket, ToType, ISchema } from 'src/interfaces/ws';
import { WsRouterDecorators } from 'src/middlewares';
import { WsGateway } from 'src/ws/gateway/ws.gateway';
import { maps } from '../game/map/maps.constants';
import Redis from 'ioredis';
import { WsGamesState } from './gateway/ws.games-state';
import { ClientActions, IClientAction } from './actions/client';
import { GameActions, IGameAction } from './actions/game';
import { ServerActions, IServerAction } from './actions/server';
import { WsLoadFileActions } from './actions/load-file';
import { TokenService } from 'src/utils/global-modules/token.service';
import { cloneDeep, isEmpty } from 'lodash';

export class WsController extends WsGateway {
  constructor(
    @InjectRedis(REDIS_NAMESPACE.SUBSCRIBE) private readonly redisSub: Redis,
    @InjectRedis(REDIS_NAMESPACE.PUBLISH) private readonly redisPub: Redis,
    readonly wsGamesState: WsGamesState,
    readonly wsLoadFileActions: WsLoadFileActions,
    protected readonly tokenService: TokenService,
    private readonly clientActions: ClientActions,
    private readonly gameActions: GameActions,
    private readonly serverActions: ServerActions,
    private readonly gameSessions: GameSessionsClass,
  ) {
    super(wsGamesState, wsLoadFileActions);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_GAME);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_SERVER);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE_CLIENT);

    this.redisSub.on('message', (channel: REDIS_ACTION, message) => {
      const { event, data } = JSON.parse(message) as {
        event: ActionTypes;
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
          if (!this.clientActions[event]) {
            throw Error(`Action name = ${event} does not exist. Message: ${message}`);
          }

          this.clientActions[event](this, data);
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
          if (!this.gameActions[event]) {
            throw Error(`Action name = ${event} does not exist. Message: ${message}`);
          }

          this.gameActions[event](this, data);
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
          if (!this.serverActions[event]) {
            throw Error(`Action name = ${event} does not exist. Message: ${message}`);
          }

          this.serverActions[event](this, data);
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

  propagateServerEvent<T extends IWsData<any, ToType>>(event: ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_SERVER, JSON.stringify({ event, data }));
  }

  propagateGameEvent<T extends IWsData<any>>(event: ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_GAME, JSON.stringify({ event, data }));
  }

  propagateClientEvent<T extends IWsData<any, ToType>>(event: ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_CLIENT, JSON.stringify({ event, data }));
  }

  propagateClientError<T extends IWsData<any, ToType> & { event: ActionTypes }>(
    event: ACTIONS.ERROR,
    data: T,
  ) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_CLIENT, JSON.stringify({ event, data }));
  }

  // @WsRouterDecorators(GAME_ACTIONS.TEST, [])
  @SubscribeMessage(ACTIONS.TEST)
  handleMessage(client: ModifyWebSocket, @MessageBody() message: IWsData<ISchema[ACTIONS.TEST]>) {
    // const fs = require('fs');
    // console.log('controller');
    // let data = "This is a file containing a collection of books.";
    //@ts-ignore
    // console.log(message);
    // fs.writeFile('books.jpg', message.payload, (err) => {
    //   if (err) console.log(err);
    //   else {
    //     console.log('File written successfully\n');
    //     console.log('The written has the following contents:');
    //     // console.log(fs.readFileSync("books.txt", "utf8"));
    //   }
    // });
    // console.log(message);
    // this.wsGamesState.addNewGame({ gameId: 4, started: false, userIds: [5] });
    // this.wsGamesState.joinUserToGame({ gameId: 4, userId: 10 });
  }

  @WsRouterDecorators(ACTIONS.AUTHENTICATED, [])
  async authenticated(client: ModifyWebSocket, message: IWsData<ISchema[ACTIONS.AUTHENTICATED]>) {
    const { userId, userRoles } = this.tokenService.decodeToken<{
      userId: number;
      userRoles: ROLES[];
    }>(message.payload.token);
    client.userId = userId;
    client.userRoles = userRoles;

    this.wsGamesState.addUserId(userId);

    return {
      event: ACTIONS.AUTHENTICATED,
      data: { payload: { message: 'Authenticated successful', uuid: message.uuid } },
    };
  }

  @WsRouterDecorators(ACTIONS.LOGOUT)
  logout(client: ModifyWebSocket) {
    this.wsGamesState.deleteUserId(client.userId);

    client.userId = null;
    client.userRoles = [];

    return {
      event: ACTIONS.LOGOUT,
      data: { payload: { message: 'Logout successful' } },
    };
  }

  @WsRouterDecorators(ACTIONS.CREATE_NEW_GAME)
  newGame(
    client: ModifyWebSocket,
    message: IWsData<ISchema[ACTIONS.CREATE_NEW_GAME]>,
  ): {
    event: ActionTypes;
    data: IWsData<{ gameId: number }, ToType>;
  } {
    const userId = client.userId;
    const gameId = this.wsGamesState.getNewGameId();
    this.gameSessions.createNewGame(
      {
        tanks: [{ ...message.payload, userId }],
        map: cloneDeep(maps.testMap),
      },
      gameId,
    );

    client.gameId = gameId;
    client.isGameHost = true;

    this.propagateServerEvent<IServerAction[ACTIONS.CREATE_NEW_GAME]>(ACTIONS.CREATE_NEW_GAME, {
      to: { gameId },
      payload: { userId },
    });

    return this.generateResponse(ACTIONS.CREATE_NEW_GAME, {
      payload: { gameId },
      uuid: message.uuid,
    });
  }

  @WsRouterDecorators(ACTIONS.JOIN_TO_GAME)
  joinToGame(client: ModifyWebSocket, message: IWsData<ISchema[ACTIONS.JOIN_TO_GAME]>) {
    const gameId = message.payload.gameId;
    const userId = client.userId;

    const game = this.wsGamesState.getStateGameById(gameId);

    if (!game) {
      client.sendError({
        event: ACTIONS.JOIN_TO_GAME,
        payload: {
          message: `Game with id = ${gameId} not found`,
        },
        uuid: message.uuid,
      });

      return;
    } else if (game.started) {
      client.sendError({
        event: ACTIONS.JOIN_TO_GAME,
        payload: {
          message: `Game with id = ${gameId} already started`,
        },
        uuid: message.uuid,
      });

      return;
    }

    message.from = { userId };
    message.to = { gameId };

    this.propagateGameEvent<IGameAction[ACTIONS.JOIN_TO_GAME]>(
      ACTIONS.JOIN_TO_GAME,
      message as IGameAction[ACTIONS.JOIN_TO_GAME],
    );
  }

  @WsRouterDecorators(ACTIONS.START_GAME)
  startGame(client: ModifyWebSocket, message: IWsData) {
    if (!client.isGameHost) {
      return {
        event: ACTIONS.ERROR,
        data: { message: 'Start game should only host' },
      };
    }
    const gameId = client.gameId;
    const game = this.gameSessions[gameId];

    game.startGame(this.propagateClientEvent.bind(this), this.propagateServerEvent.bind(this));
    this.propagateServerEvent<IServerAction[ACTIONS.START_GAME]>(ACTIONS.START_GAME, {
      to: { gameId },
    });
    this.propagateClientEvent<IClientAction[ACTIONS.START_GAME]>(ACTIONS.START_GAME, {
      uuid: message.uuid,
      payload: game.getMap(),
      to: { gameId },
    });
  }

  @WsRouterDecorators(ACTIONS.GET_NOT_STARTED_GAMES)
  getNotStartedGamesController(_client: ModifyWebSocket, message: IWsData) {
    const notStartedGameId = this.wsGamesState.getNotStartedGames();

    return {
      event: ACTIONS.GET_NOT_STARTED_GAMES,
      data: { payload: { gameIds: notStartedGameId }, uuid: message.uuid },
    };
  }

  @WsRouterDecorators(ACTIONS.PAUSE_GAME)
  pauseGame(client: ModifyWebSocket, message: IWsData<ISchema[ACTIONS.PAUSE_GAME]>) {
    const pause = message.payload.pause;
    this.propagateGameEvent<IGameAction[ACTIONS.PAUSE_GAME]>(ACTIONS.PAUSE_GAME, {
      to: { gameId: client.gameId },
      uuid: message.uuid,
      payload: { pause },
    });
  }

  @WsRouterDecorators(ACTIONS.FORCE_END_GAME, ROLES.ADMIN)
  endGame(
    _client: ModifyWebSocket,
    message: IWsData<ISchema[ACTIONS.FORCE_END_GAME]>,
  ): {
    event: ActionTypes;
    data: IWsData<{ gameId: number }, ToType>;
  } {
    const gameId = message.payload.gameId;
    const game = this.gameSessions[gameId];
    game.endGame();

    //need propagate to all users
    return this.generateResponse(ACTIONS.END_GAME, {
      payload: { gameId },
      uuid: message.uuid,
    });
  }

  @WsRouterDecorators(ACTIONS.TANK_MOVEMENT)
  tankMovement(client: ModifyWebSocket, message: IWsData<ISchema[ACTIONS.TANK_MOVEMENT]>) {
    const { userId, gameId } = client;

    message.to = { gameId };
    message.from = { userId };

    this.propagateGameEvent<IGameAction[ACTIONS.TANK_MOVEMENT]>(
      ACTIONS.TANK_MOVEMENT,
      message as IGameAction[ACTIONS.TANK_MOVEMENT],
    );
  }

  @WsRouterDecorators(ACTIONS.TANK_SHOT)
  tankShot(client: ModifyWebSocket) {
    const { userId, gameId } = client;

    this.propagateGameEvent<IGameAction[ACTIONS.TANK_SHOT]>(ACTIONS.TANK_SHOT, {
      to: { gameId },
      from: { userId },
    });
  }

  @WsRouterDecorators(ACTIONS.GET_GAME_SNAPSHOT)
  getSnapshot(client: ModifyWebSocket, message: IWsData) {
    const { userId, gameId } = client;

    this.propagateGameEvent<IGameAction[ACTIONS.GET_GAME_SNAPSHOT]>(ACTIONS.GET_GAME_SNAPSHOT, {
      to: { gameId },
      from: { userId },
      uuid: message.uuid,
    });
  }
}
