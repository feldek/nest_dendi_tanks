import { GAME_ACTIONS, SERVER_ACTIONS, IRequiredTo } from 'src/interfaces/ws';
import { WsController } from '../../ws.controller';

export interface IServerAction {
  [SERVER_ACTIONS.CREATE_NEW_GAME]: IRequiredTo<{ userId: number }>;
  [SERVER_ACTIONS.START_GAME]: IRequiredTo;
  [SERVER_ACTIONS.JOIN_TO_GAME]: IRequiredTo<{ userId: number }>;
  [SERVER_ACTIONS.LEAVE_GAME]: IRequiredTo<{ userId: number }>;
  [SERVER_ACTIONS.END_GAME]: IRequiredTo;
}

// needed to inform all node instances about event, because he accumulate info about all games status
export const serverActions = {
  [SERVER_ACTIONS.CREATE_NEW_GAME]: (
    wsServer: WsController,
    { to: { gameId }, payload: { userId } }: IServerAction[SERVER_ACTIONS.CREATE_NEW_GAME],
  ) => {
    wsServer.wsGamesState.addNewGame({ gameId, started: false, userIds: [userId] });
  },

  [GAME_ACTIONS.START_GAME](wsServer: WsController, data: IServerAction[GAME_ACTIONS.START_GAME]) {
    const test = data.to.gameId;
    wsServer.wsGamesState.changeGameStatus(test);
  },

  [SERVER_ACTIONS.JOIN_TO_GAME]: (
    wsServer: WsController,
    { to: { gameId }, payload: { userId } }: IServerAction[SERVER_ACTIONS.JOIN_TO_GAME],
  ) => {
    wsServer.wsGamesState.joinUserToGame({ gameId, userId });
  },

  //TODO: this action not exist in game-actions
  [SERVER_ACTIONS.LEAVE_GAME]: (
    wsServer: WsController,
    { to: { gameId }, payload: { userId } }: IServerAction[SERVER_ACTIONS.LEAVE_GAME],
  ) => {
    wsServer.wsGamesState.deleteUserFromGame({ gameId, userId });
  },

  // [CLIENT_ACTIONS.FORCE_END_GAME]: (
  //   wsServer: WsController,
  //   { uuid, to: { gameId } }: IClientAction[CLIENT_ACTIONS.LEAVE_GAME],
  // ) => {
  //   // wsServer.getWsClients;
  //   wsServer.sendToClient(GAME_ACTIONS.FORCE_END_GAME, {
  //     to: { gameId },
  //     uuid: uuid,
  //     payload: { message: `You game has been force-quitted by administrator` },
  //   });
  // },

  [SERVER_ACTIONS.END_GAME]: (
    wsServer: WsController,
    { to: { gameId } }: IServerAction[SERVER_ACTIONS.END_GAME],
  ) => {
    wsServer.wsGamesState.deleteGame(gameId);
  },
};
