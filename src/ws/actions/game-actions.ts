import { gameSessions } from '../../game/game-sessions.class';
import { ACTIONS, ISchema, IRequiredTo, IRequiredToFrom } from 'src/interfaces/ws';
import { WsController } from '../ws.controller';
import { TTankControl } from '../../game/tank/tank.class';
import { IClientAction } from './client-actions';
import { IServerAction } from './server-actions';

export interface IGameAction {
  [ACTIONS.JOIN_TO_GAME]: IRequiredToFrom<ISchema[ACTIONS.JOIN_TO_GAME]>;
  [ACTIONS.PAUSE_GAME]: IRequiredTo<ISchema[ACTIONS.PAUSE_GAME]>;
  [ACTIONS.FORCE_END_GAME]: IRequiredTo;
  [ACTIONS.TANK_SHOT]: IRequiredToFrom;
  [ACTIONS.TANK_MOVEMENT]: IRequiredToFrom<TTankControl>;
  [ACTIONS.GET_GAME_SNAPSHOT]: IRequiredToFrom;
}

export const gameActions = {
  [ACTIONS.JOIN_TO_GAME](wsServer: WsController, data: IGameAction[ACTIONS.JOIN_TO_GAME]) {
    const userId = data.from.userId;
    const { gameId, ...otherParams } = data.payload;
    const game = gameSessions[gameId];

    if (game.gameStarted) {
      wsServer.propagateClientError(ACTIONS.ERROR, {
        event: ACTIONS.JOIN_TO_GAME,
        to: { userId },
        uuid: data.uuid,
        payload: {
          payload: { message: `Game with id = ${gameId} already started` },
        },
      });

      return;
    }

    gameSessions.joinToGame(gameId, {
      ...otherParams,
      userId,
    });

    wsServer.propagateClientEvent<IClientAction[ACTIONS.JOIN_TO_GAME]>(ACTIONS.JOIN_TO_GAME, {
      to: { gameId },
      uuid: data.uuid,
      payload: {
        gameId,
        message: `UserId = ${userId} successful connected to game`,
      },
      from: { userId },
    });

    wsServer.propagateServerEvent<IServerAction[ACTIONS.JOIN_TO_GAME]>(ACTIONS.JOIN_TO_GAME, {
      to: { gameId },
      payload: { userId },
    });
  },

  [ACTIONS.PAUSE_GAME](wsServer: WsController, data: IGameAction[ACTIONS.PAUSE_GAME]) {
    const game = gameSessions[data.to.gameId];
    const pause = data.payload.pause;
    const changedGameState = game.pauseOnOff(pause);

    if (changedGameState) {
      wsServer.propagateClientEvent<IClientAction[ACTIONS.PAUSE_GAME]>(ACTIONS.PAUSE_GAME, {
        to: { gameId: data.to.gameId },
        uuid: data.uuid,
        payload: { pause },
      });
    }
  },

  [ACTIONS.FORCE_END_GAME](_wsServer: WsController, data: IGameAction[ACTIONS.FORCE_END_GAME]) {
    const game = gameSessions[data.to.gameId];
    game.endGame();
  },

  [ACTIONS.TANK_MOVEMENT](
    _wsServer: WsController,
    { from, to, payload }: IGameAction[ACTIONS.TANK_MOVEMENT],
  ) {
    const { gameId } = to;

    const tank = gameSessions[gameId].tanks[from.userId];
    tank.changeMovement(payload);
  },

  [ACTIONS.TANK_SHOT](_wsServer: WsController, { from, to }: IGameAction[ACTIONS.TANK_SHOT]) {
    const tank = gameSessions[to.gameId].tanks[from.userId];
    tank.shot(gameSessions[to.gameId].missiles);
  },

  [ACTIONS.GET_GAME_SNAPSHOT](
    wsServer: WsController,
    { from, to, uuid }: IGameAction[ACTIONS.GET_GAME_SNAPSHOT],
  ) {
    const game = gameSessions[to.gameId];
    const gameSnapshot = game.getGameSnapshot();

    wsServer.propagateClientEvent(ACTIONS.GET_GAME_SNAPSHOT, {
      uuid,
      payload: gameSnapshot,
      to: { userId: from.userId },
    });
  },
};
