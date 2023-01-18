import { Injectable } from '@nestjs/common';
import { ACTIONS, IRequiredTo } from 'src/interfaces/ws';
import { WsController } from 'src/ws/ws.controller';
import { IClientAction } from './client';

export interface IServerAction {
  [ACTIONS.CREATE_NEW_GAME]: IRequiredTo<{ userId: number }>;
  [ACTIONS.START_GAME]: IRequiredTo;
  [ACTIONS.JOIN_TO_GAME]: IRequiredTo<{ userId: number }>;
  [ACTIONS.LEAVE_GAME]: IRequiredTo<{ userId: number }>;
  [ACTIONS.END_GAME]: IRequiredTo;
}

// needed to inform all node instances about event, because he accumulate info about all games status
@Injectable()
export class ServerActions {
  [ACTIONS.CREATE_NEW_GAME](
    wsServer: WsController,
    { to: { gameId }, payload: { userId } }: IServerAction[ACTIONS.CREATE_NEW_GAME],
  ) {
    wsServer.wsGamesState.addNewGame({ gameId, started: false, userIds: [userId] });
  }

  [ACTIONS.START_GAME](wsServer: WsController, data: IServerAction[ACTIONS.START_GAME]) {
    const test = data.to.gameId;
    wsServer.wsGamesState.changeGameStatus(test);
  }

  [ACTIONS.JOIN_TO_GAME](
    wsServer: WsController,
    { to: { gameId }, payload: { userId }, uuid }: IServerAction[ACTIONS.JOIN_TO_GAME],
  ) {
    wsServer.wsGamesState.joinUserToGame({ gameId, userId });

    wsServer.propagateClientEvent<IClientAction[ACTIONS.JOIN_TO_GAME]>(ACTIONS.JOIN_TO_GAME, {
      to: { gameId },
      uuid: uuid,
      payload: {
        gameId,
        message: `UserId = ${userId} successful connected to game`,
      },
      from: { userId },
    });
  }

  //TODO: this action not exist in game-actions
  [ACTIONS.LEAVE_GAME](
    wsServer: WsController,
    { to: { gameId }, payload: { userId } }: IServerAction[ACTIONS.LEAVE_GAME],
  ) {
    wsServer.wsGamesState.leaveFromGame({ gameId, userId });
  }

  // [GAME_ACTIONS.FORCE_END_GAME] (
  //   wsServer: WsController,
  //   { uuid, to: { gameId } }: IClientAction[GAME_ACTIONS.LEAVE_GAME],
  // ) {
  //   // wsServer.getWsClients;
  //   wsServer.sendToClient(GAME_ACTIONS.FORCE_END_GAME, {
  //     to: { gameId },
  //     uuid: uuid,
  //     payload: { message: `You game has been force-quitted by administrator` },
  //   });
  // },

  [ACTIONS.END_GAME](wsServer: WsController, { to: { gameId } }: IServerAction[ACTIONS.END_GAME]) {
    wsServer.wsGamesState.endGame(gameId);
  }
}
