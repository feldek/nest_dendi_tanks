import { GAME_ACTIONS, SERVER_ACTIONS, IRequiredTo } from 'src/interfaces/ws';
import { WsController } from '../../ws.controller';
import { gameActions } from './game-actions.class';

export interface IServerAction {
  [SERVER_ACTIONS.CREATE_NEW_GAME]: IRequiredTo<{ userId: number }>;
  [SERVER_ACTIONS.START_GAME]: IRequiredTo<{}>;
  [SERVER_ACTIONS.JOIN_TO_GAME]: IRequiredTo<{ userId: number }>;
  [SERVER_ACTIONS.LEAVE_GAME]: IRequiredTo<{ userId: number }>;
  [SERVER_ACTIONS.END_GAME]: IRequiredTo;
}

// needed to inform all node instances about event, because he accumulate info about all games status
export const serverActions = {
  [SERVER_ACTIONS.CREATE_NEW_GAME]: (
    _wsServer: WsController,
    { to: { gameId }, payload: { userId } }: IServerAction[SERVER_ACTIONS.CREATE_NEW_GAME],
  ) => {
    gameActions.allGames.push({ gameId, started: false, userIds: [userId] });
  },

  [GAME_ACTIONS.START_GAME](_wsServer: WsController, data: IServerAction[GAME_ACTIONS.START_GAME]) {
    //forEach with mutation for performance (map slowly)
    gameActions.allGames.forEach((game) => {
      if (game.gameId === data.to.gameId) {
        game.started = true;
      }

      return game;
    });
  },

  [SERVER_ACTIONS.JOIN_TO_GAME]: (
    _wsServer: WsController,
    { to: { gameId }, payload: { userId } }: IServerAction[SERVER_ACTIONS.JOIN_TO_GAME],
  ) => {
    gameActions.allGames.forEach((game) => {
      if (game.gameId === gameId) {
        //if this user exist, then skip this step
        const findUser = game.userIds.find((currentUser) => currentUser === userId);
        if (findUser) {
          return;
        }

        game.userIds.push(userId);
      }
    });
  },

  //TODO: this action not exist in game-actions
  [SERVER_ACTIONS.LEAVE_GAME]: (
    _wsServer: WsController,
    { to: { gameId }, payload: { userId } }: IServerAction[SERVER_ACTIONS.LEAVE_GAME],
  ) => {
    gameActions.allGames = gameActions.allGames.map((game) => {
      if (game.gameId === gameId) {
        game.userIds = game.userIds.filter((currentUser) => currentUser !== userId);
      }
      return game;
    });
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
    _wsServer: WsController,
    { to: { gameId } }: IServerAction[SERVER_ACTIONS.END_GAME],
  ) => {
    gameActions.allGames = gameActions.allGames.filter((game) => game.gameId !== gameId);
  },
};
