import { gameSessions } from '../../game/game-sessions.class';
import {
  GAME_ACTIONS,
  CLIENT_ACTIONS,
  ISchema,
  SERVER_ACTIONS,
  IRequiredTo,
  IRequiredToFrom,
} from 'src/interfaces/ws';
import { WsController } from '../../ws.controller';
import { TTankControl } from '../../game/tank/tank.class';
import { IClientAction } from './client-actions';
import { IServerAction } from './server-actions';

export interface IGameAction {
  [GAME_ACTIONS.JOIN_TO_GAME]: IRequiredToFrom<ISchema[GAME_ACTIONS.JOIN_TO_GAME]>;
  [GAME_ACTIONS.PAUSE_GAME]: IRequiredTo<ISchema[GAME_ACTIONS.PAUSE_GAME]>;
  [GAME_ACTIONS.FORCE_END_GAME]: IRequiredTo;
  [GAME_ACTIONS.TANK_SHOT]: IRequiredToFrom;
  [GAME_ACTIONS.TANK_MOVEMENT]: IRequiredToFrom<TTankControl>;
}

export const gameActions = {
  [GAME_ACTIONS.JOIN_TO_GAME](
    wsServer: WsController,
    data: IGameAction[GAME_ACTIONS.JOIN_TO_GAME],
  ) {
    const userId = data.from.userId;
    const { gameId, ...otherParams } = data.payload;
    const game = gameSessions[gameId];

    if (game.gameStarted) {
      wsServer.propagateClientError(CLIENT_ACTIONS.ERROR, {
        event: GAME_ACTIONS.JOIN_TO_GAME,
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

    wsServer.propagateClientEvent<IClientAction[CLIENT_ACTIONS.JOIN_TO_GAME]>(
      CLIENT_ACTIONS.JOIN_TO_GAME,
      {
        to: { gameId },
        uuid: data.uuid,
        payload: {
          gameId,
          message: `UserId = ${userId} successful connected to game`,
        },
        from: { userId },
      },
    );

    wsServer.propagateServerEvent<IServerAction[SERVER_ACTIONS.JOIN_TO_GAME]>(
      SERVER_ACTIONS.JOIN_TO_GAME,
      {
        to: { gameId },
        payload: { userId },
      },
    );
  },

  [GAME_ACTIONS.PAUSE_GAME](wsServer: WsController, data: IGameAction[GAME_ACTIONS.PAUSE_GAME]) {
    const game = gameSessions[data.to.gameId];
    const pause = data.payload.pause;
    const changedGameState = game.pauseOnOff(pause);

    if (changedGameState) {
      wsServer.propagateClientEvent<IClientAction[CLIENT_ACTIONS.PAUSE_GAME]>(
        CLIENT_ACTIONS.PAUSE_GAME,
        { to: { gameId: data.to.gameId }, uuid: data.uuid, payload: { pause } },
      );
    }
  },

  [GAME_ACTIONS.FORCE_END_GAME](
    _wsServer: WsController,
    data: IGameAction[GAME_ACTIONS.FORCE_END_GAME],
  ) {
    const game = gameSessions[data.to.gameId];
    game.endGame();
  },

  [GAME_ACTIONS.TANK_MOVEMENT](
    _wsServer: WsController,
    { from, to, payload }: IGameAction[GAME_ACTIONS.TANK_MOVEMENT],
  ) {
    const { gameId } = to;

    const tank = gameSessions[gameId].tanks[from.userId];
    tank.changeMovement(payload);
  },

  [GAME_ACTIONS.TANK_SHOT](
    _wsServer: WsController,
    { from, to }: IGameAction[GAME_ACTIONS.TANK_SHOT],
  ) {
    const tank = gameSessions[to.gameId].tanks[from.userId];
    tank.shot(gameSessions[to.gameId].missiles);
  },
};
