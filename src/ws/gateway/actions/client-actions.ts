import { ToType, IRequiredTo, CLIENT_ACTIONS, IWsData } from 'src/interfaces/ws';
import { directionType } from 'src/ws/game/common/dynamicObj.class';
import { MissilesClass } from 'src/ws/game/missiles/missiles.class';
import { WsController } from '../../ws.controller';

export interface IClientAction {
  [CLIENT_ACTIONS.ERROR]: IRequiredTo<{ message: string; status?: number }, ToType>;
  [CLIENT_ACTIONS.JOIN_TO_GAME]: IRequiredTo<{ gameId: number; message: string }, ToType>;
  [CLIENT_ACTIONS.GAME_SNAPSHOT]: IRequiredTo<{
    tanks: {
      x: number;
      y: number;
      currentArmor: number;
      direction: directionType;
      userId: number;
      teamId: string;
    }[];
    missiles: MissilesClass[];
  }>;
  [CLIENT_ACTIONS.END_GAME]: IRequiredTo<{ message: string; teamWin: string }>;
}

// needed to inform all node instances about event
export const clientActions = {
  [CLIENT_ACTIONS.ERROR]: (wsServer: WsController, data: IClientAction[CLIENT_ACTIONS.ERROR]) => {
    wsServer.sendToClient(CLIENT_ACTIONS.ERROR, data);
  },

  [CLIENT_ACTIONS.JOIN_TO_GAME]: (
    wsServer: WsController,
    data: IClientAction[CLIENT_ACTIONS.JOIN_TO_GAME],
  ) => {
    wsServer.sendToClient(CLIENT_ACTIONS.JOIN_TO_GAME, data);
  },

  [CLIENT_ACTIONS.GAME_SNAPSHOT]: (
    wsServer: WsController,
    data: IClientAction[CLIENT_ACTIONS.GAME_SNAPSHOT],
  ) => {
    wsServer.sendToClient(CLIENT_ACTIONS.GAME_SNAPSHOT, data);
  },

  [CLIENT_ACTIONS.END_GAME]: (
    wsServer: WsController,
    data: IClientAction[CLIENT_ACTIONS.END_GAME],
  ) => {
    const wsClients = wsServer.getWsClients({ gameId: data.to.gameId });

    if (!wsClients.length) {
      return;
    }

    wsClients.map((client) => {
      client.gameId === null;
    });
    
    wsServer.sendToClient(CLIENT_ACTIONS.END_GAME, data);
  },
};
