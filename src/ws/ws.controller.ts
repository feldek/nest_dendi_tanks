import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { MessageBody, SubscribeMessage } from '@nestjs/websockets';
import { ROLES } from 'src/constants';
import { REDIS_ACTION, REDIS_NAMESPACE } from 'src/constants/redis.constants';
import { ACTIONS, ACTIONS_TO_CLIENT, IWsData, ModifyWebSocket } from 'src/interfaces/ws';
import { WsRouterDecorators } from 'src/middlewares';
import { WsGateway } from 'src/ws/ws.gateway';
import { gameSessions } from './game/gameSessions.class';
import { maps } from './game/map/maps.constants';
import { IJoi } from './schema/intex';
import Redis from 'ioredis';
import { AuthService } from 'src/controllers/auth/auth.service';

export class WsController extends WsGateway {
  constructor(
    @InjectRedis(REDIS_NAMESPACE.SUBSCRIBE) private readonly redisSub: Redis,
    @InjectRedis(REDIS_NAMESPACE.PUBLISH) private readonly redisPub: Redis,
    protected authService: AuthService,
  ) {
    super(authService);
    this.redisSub.subscribe(REDIS_ACTION.PROPAGATE);

    this.redisSub.on('message', (channel, message) => {
      console.log(channel);
      // console.log(message);
      console.log('propagated redis msg', message);
      this.sendMessage(ACTIONS.ERROR, {
        to: { userId: 46 },
        payload: { message: 'msg from redis' },
      });

      const listWsClients = Array.from(this.server.clients);
      listWsClients[0].send(
        JSON.stringify({
          event: ACTIONS.ERROR,
          data: {
            to: { userId: 46 },
            payload: { message: 'msg from redis' },
          },
        }),
      );
    });
  }
  // @WsRoleGuard(ROLES.ADMIN)
  @WsRouterDecorators(ACTIONS.TEST)
  handleMessage(@MessageBody() message: IWsData<IJoi[ACTIONS.TEST]>) {
    console.log('income ws-client message', message);

    this.redisPub.publish(
      REDIS_ACTION.PROPAGATE,
      JSON.stringify({
        event: ACTIONS.SEND_MSG,
        data: { payload: { message: 'msg from redis' } },
      }),
    );
    // this.sendMessage(ACTIONS.ERROR, {
    //   to: { userId: 46 },
    //   payload: { message: 'msg from redis' },
    // });
    // return this.generateResponse(ACTIONS.CONNECTION, {
    //   uuid: 'test',
    //   payload: { test: 'test_msg' },
    // });
  }
  @SubscribeMessage(ACTIONS.SEND_MSG)
  onEvent(@MessageBody() message: IWsData<{ test: string }>) {
    this.sendMessage(ACTIONS.SEND_MSG, message);
  }

  @WsRouterDecorators(ACTIONS.AUTHENTICATED, [])
  async authenticated(client: ModifyWebSocket, message: IWsData<IJoi[ACTIONS.AUTHENTICATED]>) {
    const { userId, userRoles } = this.authService.decodeToken<{
      userId: number;
      userRoles: ROLES[];
    }>(message.payload.token);
    console.log(userId);
    console.log(userRoles);

    client.userId = userId;
    client.userRoles = userRoles;

    this.userIds.push(userId);
  }

  @WsRouterDecorators(ACTIONS.LOGOUT)
  async logout(client: ModifyWebSocket) {
    this.userIds = this.userIds.filter((userId) => userId !== client.userId);

    client.userId = null;
    client.userRoles = [];
  }

  @WsRouterDecorators(ACTIONS.CREATE_NEW_GAME)
  newGame(client: ModifyWebSocket, message: IWsData<IJoi[ACTIONS.CREATE_NEW_GAME]>) {
    const userId = client.userId;
    const gameId = gameSessions.createGameSession({
      tanks: [
        {
          ...message.payload,
          userId,
          ws: this.getWsConnectionBy(userId),
        },
      ],
      map: maps.testMap,
    });

    client.gameId = gameId;
    return this.generateResponse(ACTIONS_TO_CLIENT.SET_GAME_ID, {
      payload: { gameId },
      uuid: message.uuid,
    });
  }

  @WsRouterDecorators(ACTIONS.JOIN_TO_GAME)
  joinToGame(client: ModifyWebSocket, message: IWsData<IJoi[ACTIONS.JOIN_TO_GAME]>) {
    const userId = client.userId;
    const { gameId, ...otherParams } = message.payload;
    gameSessions.joinToGame(gameId, {
      ...otherParams,
      userId,
      ws: this.getWsConnectionBy(userId),
    });

    if (gameSessions[gameId].gameStarted) {
      return this.generateResponse(ACTIONS.ERROR, {
        payload: { message: `GameId = ${gameId} already launched` },
        uuid: message.uuid,
      });
    }
    gameSessions[gameId].startGame();
    client.gameId = gameId;
  }

  @WsRouterDecorators(ACTIONS.START_GAME)
  startGame(client: ModifyWebSocket) {
    const game = gameSessions[client.gameId];
    game.startGame();
  }

  @WsRouterDecorators(ACTIONS.PAUSE_GAME)
  pauseGame(client: ModifyWebSocket) {
    const game = gameSessions[client.gameId];
    game.pauseOnOff();
  }

  @WsRouterDecorators(ACTIONS.FORCE_END_GAME)
  endGame(@MessageBody() message: IWsData<IJoi[ACTIONS.FORCE_END_GAME]>) {
    const game = gameSessions[message.payload.gameId];
    game.endGame();
  }

  @WsRouterDecorators(ACTIONS.GET_NOT_STARTED_GAMES, ROLES.ADMIN)
  getNotStartedGames() {
    const gameList: { gameId: number; currentUsers: number }[] = Object.keys(gameSessions).flatMap(
      (key) => {
        const game = gameSessions[+key];
        return game.gameStarted
          ? []
          : { gameId: +key, currentUsers: Object.keys(game.tanks).length };
      },
    );

    return this.sendToClient[ACTIONS.GET_NOT_STARTED_GAMES](gameList);
  }

  @WsRouterDecorators(ACTIONS.TANK_MOVEMENT)
  tankMovement(client: ModifyWebSocket, message: IWsData<IJoi[ACTIONS.TANK_MOVEMENT]>) {
    const { userId, gameId } = client;
    const tank = gameSessions[gameId].tanks[userId];
    tank.changeMovement(message.payload);
  }

  @WsRouterDecorators(ACTIONS.TANK_SHOT)
  tankShot(client: ModifyWebSocket) {
    const { userId, gameId } = client;
    const tank = gameSessions[gameId].tanks[userId];
    tank.shot(gameSessions[gameId].missiles);
  }

  sendToClient = {
    [ACTIONS.GET_NOT_STARTED_GAMES]: (payload: { gameId: number; currentUsers: number }[]) => {
      return { event: ACTIONS.GET_NOT_STARTED_GAMES, data: { payload } };
    },
  };
}
