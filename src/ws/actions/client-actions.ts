import { RequiredField } from 'src/interfaces/common';
import { ToType, IRequiredTo, ISchema, ACTIONS } from 'src/interfaces/ws';
import { WsErrorType } from 'src/middlewares/ws.interceptor';
import { directionType } from 'src/game/common/dynamicObj.class';
import { MissilesClass } from 'src/game/missiles/missiles.class';
import { WsController } from '../ws.controller';

export interface IClientAction {
  [ACTIONS.ERROR]: RequiredField<WsErrorType, 'to' | 'payload'>;
  [ACTIONS.JOIN_TO_GAME]: IRequiredTo<{ gameId: number; message: string }, ToType>;
  [ACTIONS.START_GAME]: IRequiredTo;
  [ACTIONS.GAME_SNAPSHOT]: IRequiredTo<{
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
  [ACTIONS.END_GAME]: IRequiredTo<{ message: string; teamWin: string }>;
  [ACTIONS.PAUSE_GAME]: IRequiredTo<ISchema[ACTIONS.PAUSE_GAME]>;
}

// needed to inform all node instances about event
export const clientActions = {
  [ACTIONS.ERROR]: (wsServer: WsController, data: IClientAction[ACTIONS.ERROR]) => {
    wsServer.sendToClient(ACTIONS.ERROR, data);
  },
  [ACTIONS.START_GAME]: (wsServer: WsController, data: IClientAction[ACTIONS.START_GAME]) => {
    const message = {
      ...data,
      payload: { message: `GameId ${data.to.gameId} successfully started` },
    };
    wsServer.sendToClient(ACTIONS.START_GAME, message);
  },

  [ACTIONS.JOIN_TO_GAME]: (wsServer: WsController, data: IClientAction[ACTIONS.JOIN_TO_GAME]) => {
    const [client] = wsServer.getWsClients({ userId: data.from.userId });

    if (!client) {
      return;
    }
    client.gameId = data.payload.gameId;
    wsServer.sendToClient(ACTIONS.JOIN_TO_GAME, data);
  },

  [ACTIONS.GAME_SNAPSHOT]: (wsServer: WsController, data: IClientAction[ACTIONS.GAME_SNAPSHOT]) => {
    wsServer.sendToClient(ACTIONS.GAME_SNAPSHOT, data);
  },

  [ACTIONS.GET_GAME_SNAPSHOT]: (
    wsServer: WsController,
    data: IClientAction[ACTIONS.GAME_SNAPSHOT],
  ) => {
    wsServer.sendToClient(ACTIONS.GET_GAME_SNAPSHOT, data);
  },

  [ACTIONS.PAUSE_GAME]: (wsServer: WsController, data: IClientAction[ACTIONS.PAUSE_GAME]) => {
    wsServer.sendToClient(ACTIONS.PAUSE_GAME, data);
  },

  [ACTIONS.END_GAME]: (wsServer: WsController, data: IClientAction[ACTIONS.END_GAME]) => {
    const wsClients = wsServer.getWsClients({ gameId: data.to.gameId });

    if (!wsClients.length) {
      return;
    }

    wsClients.map((client) => {
      client.gameId === null;
    });

    wsServer.sendToClient(ACTIONS.END_GAME, data);
  },
};
