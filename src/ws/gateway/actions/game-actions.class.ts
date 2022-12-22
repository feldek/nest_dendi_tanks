import {
  GAME_ACTIONS,
  CLIENT_ACTIONS,
  IWsData,
  ModifyWebSocket,
  ISchema,
  SERVER_ACTIONS,
  IRequiredTo,
  IRequiredToFrom,
} from 'src/interfaces/ws';
import { WsController } from '../../ws.controller';
import { WsGateway } from '../ws.gateway';
import { GameSessionsClass } from '../../game/game-sessions.class';
import { TTankControl } from '../../game/tank/tank.class';
import { IClientAction } from './client-actions';
import { IServerAction } from './server-actions';

export interface IGameAction {
  [GAME_ACTIONS.JOIN_TO_GAME]: IRequiredToFrom<ISchema[GAME_ACTIONS.JOIN_TO_GAME]>;
  [GAME_ACTIONS.PAUSE_GAME]: IRequiredTo;
  [GAME_ACTIONS.FORCE_END_GAME]: IRequiredTo;
  [GAME_ACTIONS.TANK_SHOT]: IRequiredToFrom;
  [GAME_ACTIONS.TANK_MOVEMENT]: IRequiredToFrom<TTankControl>;
}

class GameActionsClass extends GameSessionsClass {
  protected sendToClient(client: ModifyWebSocket, action: GAME_ACTIONS, message: IWsData<any>) {
    client.send(JSON.stringify(WsGateway.generateResponse(action, message)));
  }

  [GAME_ACTIONS.JOIN_TO_GAME](
    wsServer: WsController,
    data: IGameAction[GAME_ACTIONS.JOIN_TO_GAME],
  ) {
    const userId = data.from.userId;
    const { gameId, ...otherParams } = data.payload;
    const game = gameActions[gameId];

    if (game.gameStarted) {
      wsServer.propagateClientEvent(CLIENT_ACTIONS.ERROR, {
        to: { userId },
        uuid: data.uuid,
        payload: {
          payload: { message: `Game with id = ${gameId} already started` },
        },
      });

      return;
    }

    this.joinToGame(gameId, {
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

    // wsClient.gameId = gameId;
    wsServer.propagateServerEvent<IServerAction[SERVER_ACTIONS.JOIN_TO_GAME]>(
      SERVER_ACTIONS.JOIN_TO_GAME,
      {
        to: { gameId },
        payload: { userId },
      },
    );
  }

  [GAME_ACTIONS.PAUSE_GAME](_wsServer: WsController, data: IGameAction[GAME_ACTIONS.PAUSE_GAME]) {
    const game = gameActions[data.to.gameId];
    game.pauseOnOff();
  }

  [GAME_ACTIONS.FORCE_END_GAME](
    _wsServer: WsController,
    data: IGameAction[GAME_ACTIONS.FORCE_END_GAME],
  ) {
    const game = gameActions[data.to.gameId];
    game.endGame();
  }

  [GAME_ACTIONS.TANK_MOVEMENT](
    _wsServer: WsController,
    { from, to, payload }: IGameAction[GAME_ACTIONS.TANK_MOVEMENT],
  ) {
    const { gameId } = to;

    const tank = gameActions[gameId].tanks[from.userId];
    tank.changeMovement(payload);
  }
  //
  [GAME_ACTIONS.TANK_SHOT](
    _wsServer: WsController,
    { from, to }: IGameAction[GAME_ACTIONS.TANK_SHOT],
  ) {
    const tank = gameActions[to.gameId].tanks[from.userId];
    tank.shot(gameActions[to.gameId].missiles);
  }
}

export const gameActions = new GameActionsClass();
