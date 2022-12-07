import { MessageBody, SubscribeMessage } from '@nestjs/websockets';
import { ROLES } from 'src/constants';
import { ACTIONS, ACTIONS_TO_CLIENT, IWsMessage, ModifyWebSocket } from 'src/interfaces/ws';
import { WsRouterDecorators } from 'src/middlewares';
import { WsRoleGuard } from 'src/middlewares/roles.guard';
import { WsGateway } from 'src/ws/ws.gateway';
import { gameSessions } from './game/gameSessions.class';
import { maps } from './game/map/maps.constants';
import { IJoi } from './schema/intex';

export class WsController extends WsGateway {
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
}
