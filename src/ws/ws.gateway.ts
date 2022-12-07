import { v4 as uuidv4 } from 'uuid';
import { maps } from './game/map/maps.constants';
import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { intersection } from 'lodash';
import { ACTIONS, ACTIONS_TO_CLIENT, IWsMessage, ModifyWebSocket } from 'src/interfaces/ws';
import { Server } from 'ws';
import { gameSessions } from './game/gameSessions.class';
import { IJoi } from './schema/intex';
import { WsRouterDecorators } from 'src/middlewares';
import { WsRoleGuard } from 'src/middlewares/roles.guard';
import { ROLES } from 'src/constants';

@WebSocketGateway({
  cors: {
    origin: ['*'],
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server<ModifyWebSocket>;

  private logger: Logger = new Logger('AppGateway');

  //nest expects an object to have the format { event: string, data: {...any} }
  //it's unnecessary but recommended
  private sendMessage<T>(message: IWsMessage<T>) {
    //find consumer in accordance with "to" obj {userId or groups}
    const listWsClients = Array.from(this.server.clients);
    const userTarget = Object.entries(message.to)
      .map(([targetName, targetValue]) =>
        listWsClients.filter((user) => {
          const userTargetField = Array.isArray(user[targetName])
            ? user[targetName]
            : [user[targetName]];
          return intersection(userTargetField, targetValue).length;
        }),
      )
      .flat();

    userTarget.forEach((user) => {
      user.send(JSON.stringify(this.generateResponse<T>(message)));
    });
  }

  private generateResponse<T>(message: IWsMessage<T>): {
    event: IWsMessage<T>['event'];
    data: Omit<IWsMessage<T>, 'event'>;
  } {
    const { event, ...otherParams } = message;
    return { event, data: otherParams };
  }

  private getWsConnectionBy(userId: number) {
    const listWsClients = Array.from(this.server.clients);
    return listWsClients.find((client) => client.userId === userId);
  }

  @WsRoleGuard(ROLES.ADMIN)
  @WsRouterDecorators(ACTIONS.TEST)
  handleMessage(@MessageBody() message: IWsMessage<IJoi[ACTIONS.TEST]>) {
    console.log(message);

    return this.generateResponse<{ test: string }>({
      event: ACTIONS.CONNECTION,
      uuid: 'test',
      payload: { test: 'test_msg' },
    });
  }

  @SubscribeMessage(ACTIONS.SEND_MSG)
  onEvent(@MessageBody() message: IWsMessage<{ test: string }>) {
    this.sendMessage(message);
  }

  @WsRouterDecorators(ACTIONS.CREATE_NEW_GAME)
  newGame(client: ModifyWebSocket, message: IWsMessage<IJoi[ACTIONS.CREATE_NEW_GAME]>) {
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
    return this.generateResponse({
      event: ACTIONS_TO_CLIENT.SET_GAME_ID,
      payload: { gameId },
      uuid: message.uuid,
    });
  }

  @WsRouterDecorators(ACTIONS.JOIN_TO_GAME)
  joinToGame(client: ModifyWebSocket, message: IWsMessage<IJoi[ACTIONS.JOIN_TO_GAME]>) {
    const userId = client.userId;
    const { gameId, ...otherParams } = message.payload;
    gameSessions.joinToGame(gameId, {
      ...otherParams,
      userId,
      ws: this.getWsConnectionBy(userId),
    });

    if (gameSessions[gameId].gameStarted) {
      return this.generateResponse({
        event: ACTIONS.ERROR,
        payload: { message: `GameId = ${gameId} already launched` },
        uuid: message.uuid,
      });
    }
    gameSessions[gameId].startGame();
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
  endGame(@MessageBody() message: IWsMessage<IJoi[ACTIONS.FORCE_END_GAME]>) {
    const game = gameSessions[message.payload.gameId];
    game.endGame();
  }

  @WsRoleGuard(ROLES.ADMIN)
  @WsRouterDecorators(ACTIONS.GET_NOT_STARTED_GAMES)
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
  tankMovement(client: ModifyWebSocket, message: IWsMessage<IJoi[ACTIONS.TANK_MOVEMENT]>) {
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

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: ModifyWebSocket) {
    this.logger.log(`Client disconnected: ${client.userId}`);
  }

  // handleConnection(@ConnectedSocket() client: ModifyWebSocket, ...args: any[]) {
  handleConnection(client: ModifyWebSocket, ...args: any[]) {
    const clientId = +args[0].headers.userid;
    client.userId = clientId;
    //TODO: get role from db
    client.groups = ['group_test'];
    client.userRoles = [ROLES.ADMIN];

    this.logger.log(`Client connected: ${clientId}`);

    const message = JSON.stringify(
      this.generateResponse({
        event: ACTIONS.CONNECTION,
        payload: { message: `Hello user ${clientId}` },
        uuid: uuidv4(),
      }),
    );
    client.send(message);
  }

  static sendError<T = {}>(
    client: ModifyWebSocket,
    data: { message: string; status?: number } & T,
  ) {
    client.send(
      JSON.stringify({
        event: ACTIONS.ERROR,
        data: { message: data.message, status: data.status || 400 },
      }),
    );
  }
}
