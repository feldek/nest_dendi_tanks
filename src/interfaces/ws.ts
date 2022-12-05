import { RequireOnlyOne } from './common';
import { WebSocket } from 'ws';

interface ITargetWs {
  userId: number;
  groups: string[];
  gameId: number;
}

export interface IWsMessage<T extends {}> {
  event: ACTIONS | ACTIONS_TO_CLIENT;
  uuid: string;
  payload?: T;
  to?: RequireOnlyOne<ITargetWs, 'userId' | 'groups' | 'gameId'>;
  from?: number;
}

export interface ModifyWebSocket extends WebSocket, ITargetWs {}

export const enum ACTIONS {
  ERROR = 'ERROR',
  CONNECTION = 'CONNECTION',
  SEND_MSG = 'SEND_MSG',
  CREATE_NEW_GAME = 'CREATE_NEW_GAME',
  START_GAME = 'START_GAME',
  PAUSE_GAME = 'PAUSE_GAME',
  JOIN_TO_GAME = 'JOIN_TO_GAME',
  FORCE_END_GAME = 'FORCE_END_GAME',
  GET_NOT_STARTED_GAMES = 'GET_NOT_STARTED_GAMES',
  TANK_MOVEMENT = 'TANK_MOVEMENT',
  TANK_SHOT = 'TANK_SHOT',
}

export const enum ACTIONS_TO_CLIENT {
  SET_GAME_ID = 'SET_GAME_ID',
  SET_NOT_STARTED_GAMES = 'SET_NOT_STARTED_GAMES',
  SET_GAME_DATA = 'SET_GAME_DATA',
}
