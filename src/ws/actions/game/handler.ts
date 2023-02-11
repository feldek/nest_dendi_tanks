import { Injectable } from '@nestjs/common';
import { ISchema, IRequiredTo, IRequiredToFrom } from 'src/interfaces/ws';
import { WsController } from '../../controller/controller';
import { TTankControl } from '../../../game/tank/tank.class';
import { GameSessionsClass } from 'src/game/game-sessions.class';
import { ACTIONS } from 'src/constants/actions.constants';

export interface IHandleGame {
  [ACTIONS.JOIN_TO_GAME]: IRequiredToFrom<ISchema[ACTIONS.JOIN_TO_GAME]>;
  [ACTIONS.PAUSE_GAME]: IRequiredTo<ISchema[ACTIONS.PAUSE_GAME]>;
  [ACTIONS.FORCE_END_GAME]: IRequiredTo;
  [ACTIONS.TANK_SHOT]: IRequiredToFrom;
  [ACTIONS.TANK_MOVEMENT]: IRequiredToFrom<TTankControl>;
  [ACTIONS.GET_GAME_SNAPSHOT]: IRequiredToFrom;
}

@Injectable()
export class HandleGame {
  constructor(private readonly gameSessions: GameSessionsClass) {}

  [ACTIONS.JOIN_TO_GAME](wsServer: WsController, data: IHandleGame[ACTIONS.JOIN_TO_GAME]) {
    const userId = data.from.userId;
    const { gameId, ...otherParams } = data.payload;
    const game = this.gameSessions[gameId];

    if (game.gameStarted) {
      wsServer.emitClient.propagateClientError(ACTIONS.ERROR, {
        event: ACTIONS.JOIN_TO_GAME,
        to: { userId },
        uuid: data.uuid,
        payload: {
          payload: { message: `Game with id = ${gameId} already started` },
        },
      });

      return;
    }

    this.gameSessions.joinToGame(gameId, {
      ...otherParams,
      userId,
    });

    wsServer.emitServer[ACTIONS.JOIN_TO_GAME]({
      to: { gameId },
      payload: { userId },
      uuid: data.uuid,
    });
  }

  [ACTIONS.PAUSE_GAME](wsServer: WsController, data: IHandleGame[ACTIONS.PAUSE_GAME]) {
    const game = this.gameSessions[data.to.gameId];
    const pause = data.payload.pause;
    const changedGameState = game.pauseOnOff(pause);

    if (changedGameState) {
      wsServer.emitClient[ACTIONS.PAUSE_GAME]({
        to: { gameId: data.to.gameId },
        uuid: data.uuid,
        payload: { pause },
      });
    }
  }

  [ACTIONS.FORCE_END_GAME](_wsServer: WsController, data: IHandleGame[ACTIONS.FORCE_END_GAME]) {
    const game = this.gameSessions[data.to.gameId];
    game.endGame();
  }

  [ACTIONS.TANK_MOVEMENT](
    _wsServer: WsController,
    { from, to, payload }: IHandleGame[ACTIONS.TANK_MOVEMENT],
  ) {
    const { gameId } = to;

    const tank = this.gameSessions[gameId].tanks[from.userId];
    tank.changeMovement(payload);
  }

  [ACTIONS.TANK_SHOT](_wsServer: WsController, { from, to }: IHandleGame[ACTIONS.TANK_SHOT]) {
    const tank = this.gameSessions[to.gameId].tanks[from.userId];
    tank.shot(this.gameSessions[to.gameId].missiles);
  }

  [ACTIONS.GET_GAME_SNAPSHOT](
    wsServer: WsController,
    { from, to, uuid }: IHandleGame[ACTIONS.GET_GAME_SNAPSHOT],
  ) {
    const game = this.gameSessions[to.gameId];
    const gameSnapshot = game.getGameSnapshot();

    wsServer.emitClient[ACTIONS.GET_GAME_SNAPSHOT]({
      uuid,
      payload: gameSnapshot,
      to: { userId: from.userId },
    });
  }
}
