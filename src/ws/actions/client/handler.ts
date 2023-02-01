import { MapClass } from 'src/game/map/map.class';
import { Injectable } from '@nestjs/common';
import { RequiredField } from 'src/interfaces/common';
import { ToType, IRequiredTo, ISchema, ACTIONS } from 'src/interfaces/ws';
import { WsErrorType } from 'src/middlewares/ws.interceptor';
import { directionType } from 'src/game/common/dynamicObj.class';
import { MissilesClass } from 'src/game/missiles/missiles.class';
import { WsController } from 'src/ws/controller/controller';

export interface IHandleClient {
  [ACTIONS.ERROR]: RequiredField<WsErrorType, 'to' | 'payload'>;
  [ACTIONS.JOIN_TO_GAME]: IRequiredTo<{ gameId: number; message: string }, ToType>;
  [ACTIONS.START_GAME]: IRequiredTo<MapClass>;
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
@Injectable()
export class HandleClient {
  [ACTIONS.ERROR](wsServer: WsController, data: IHandleClient[ACTIONS.ERROR]) {
    wsServer.sendToClient(ACTIONS.ERROR, data);
  }
  [ACTIONS.START_GAME](wsServer: WsController, data: IHandleClient[ACTIONS.START_GAME]) {
    wsServer.sendToClient(ACTIONS.START_GAME, data);
  }

  [ACTIONS.JOIN_TO_GAME](wsServer: WsController, data: IHandleClient[ACTIONS.JOIN_TO_GAME]) {
    const [client] = wsServer.getWsClients({ userId: data.from.userId });

    if (!client) {
      return;
    }
    client.gameId = data.payload.gameId;
    wsServer.sendToClient(ACTIONS.JOIN_TO_GAME, data);
  }

  [ACTIONS.GAME_SNAPSHOT](wsServer: WsController, data: IHandleClient[ACTIONS.GAME_SNAPSHOT]) {
    wsServer.sendToClient(ACTIONS.GAME_SNAPSHOT, data);
  }

  [ACTIONS.GET_GAME_SNAPSHOT](wsServer: WsController, data: IHandleClient[ACTIONS.GAME_SNAPSHOT]) {
    wsServer.sendToClient(ACTIONS.GET_GAME_SNAPSHOT, data);
  }

  [ACTIONS.PAUSE_GAME](wsServer: WsController, data: IHandleClient[ACTIONS.PAUSE_GAME]) {
    wsServer.sendToClient(ACTIONS.PAUSE_GAME, data);
  }

  [ACTIONS.END_GAME](wsServer: WsController, data: IHandleClient[ACTIONS.END_GAME]) {
    const wsClients = wsServer.getWsClients({ gameId: data.to.gameId });

    if (!wsClients.length) {
      return;
    }

    wsClients.map((client) => {
      client.gameId === null;
    });

    wsServer.sendToClient(ACTIONS.END_GAME, data);
  }
}
