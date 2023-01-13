import { RequiredField } from 'src/interfaces/common';
import { ToType, IRequiredTo, CLIENT_ACTIONS, ISchema, GAME_ACTIONS } from 'src/interfaces/ws';
import { WsErrorType } from 'src/middlewares/ws.interceptor';
import { directionType } from 'src/ws/game/common/dynamicObj.class';
import { MissilesClass } from 'src/ws/game/missiles/missiles.class';
import { WsController } from '../../ws.controller';

export interface IClientAction {
  [CLIENT_ACTIONS.ERROR]: RequiredField<WsErrorType, 'to' | 'payload'>;
  [CLIENT_ACTIONS.JOIN_TO_GAME]: IRequiredTo<{ gameId: number; message: string }, ToType>;
  [CLIENT_ACTIONS.START_GAME]: IRequiredTo;
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
  [CLIENT_ACTIONS.PAUSE_GAME]: IRequiredTo<ISchema[GAME_ACTIONS.PAUSE_GAME]>;
}

// needed to inform all node instances about event
export const clientActions = {
  [CLIENT_ACTIONS.ERROR]: (wsServer: WsController, data: IClientAction[CLIENT_ACTIONS.ERROR]) => {
    wsServer.sendToClient(CLIENT_ACTIONS.ERROR, data);
  },
  [CLIENT_ACTIONS.START_GAME]: (
    wsServer: WsController,
    data: IClientAction[CLIENT_ACTIONS.START_GAME],
  ) => {
    const message = {
      ...data,
      payload: { message: `GameId ${data.to.gameId} successfully started` },
    };
    wsServer.sendToClient(CLIENT_ACTIONS.START_GAME, message);
  },

  [CLIENT_ACTIONS.JOIN_TO_GAME]: (
    wsServer: WsController,
    data: IClientAction[CLIENT_ACTIONS.JOIN_TO_GAME],
  ) => {
    const [client] = wsServer.getWsClients({ userId: data.from.userId });

    if (!client) {
      return;
    }
    client.gameId = data.payload.gameId;
    wsServer.sendToClient(CLIENT_ACTIONS.JOIN_TO_GAME, data);
  },

  [CLIENT_ACTIONS.GAME_SNAPSHOT]: (
    wsServer: WsController,
    data: IClientAction[CLIENT_ACTIONS.GAME_SNAPSHOT],
  ) => {
    wsServer.sendToClient(CLIENT_ACTIONS.GAME_SNAPSHOT, data);
  },

  [CLIENT_ACTIONS.PAUSE_GAME]: (
    wsServer: WsController,
    data: IClientAction[CLIENT_ACTIONS.PAUSE_GAME],
  ) => {
    wsServer.sendToClient(CLIENT_ACTIONS.PAUSE_GAME, data);
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
