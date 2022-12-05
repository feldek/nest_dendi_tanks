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
import { ITankClass, TTankControl } from './game/tank/tank.class';

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

  // handleMessage(_client: ModifyWebSocket, message: IWsMessage) {
  @SubscribeMessage('message')
  handleMessage(@MessageBody() message: IWsMessage<{ test: string }>) {
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

  @SubscribeMessage(ACTIONS.CREATE_NEW_GAME)
  newGame(client: ModifyWebSocket, message: IWsMessage<Omit<ITankClass, 'ws' | 'userId'>>) {
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

  @SubscribeMessage(ACTIONS.JOIN_TO_GAME)
  joinToGame(
    client: ModifyWebSocket,
    message: IWsMessage<Omit<ITankClass, 'ws' | 'userId'> & { gameId: number }>,
  ) {
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

  @SubscribeMessage(ACTIONS.START_GAME)
  startGame(client: ModifyWebSocket) {
    const game = gameSessions[client.gameId];
    game.startGame();
  }

  @SubscribeMessage(ACTIONS.PAUSE_GAME)
  pauseGame(client: ModifyWebSocket) {
    const game = gameSessions[client.gameId];
    game.pauseOnOff();
  }

  // TODO: added admin check
  @SubscribeMessage(ACTIONS.FORCE_END_GAME)
  endGame(@MessageBody() message: IWsMessage<{ gameId: number }>) {
    const game = gameSessions[message.payload.gameId];
    game.endGame();
  }

  @SubscribeMessage(ACTIONS.GET_NOT_STARTED_GAMES)
  getNotStartedGames(client: ModifyWebSocket) {
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

  @SubscribeMessage(ACTIONS.TANK_MOVEMENT)
  tankMovement(client: ModifyWebSocket, message: IWsMessage<TTankControl>) {
    const { userId, gameId } = client;
    const tank = gameSessions[gameId].tanks[userId];
    tank.changeMovement(message.payload);
  }

  @SubscribeMessage(ACTIONS.TANK_SHOT)
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
    client.groups = ['group_test'];

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
}
