import { RequireOnlyOne } from './common';
import { WebSocket } from 'ws';
import { ROLES } from 'src/constants';

interface ITargetWs {
  userId: number | null;
  groups: string[];
  gameId: number | null;
}

interface IUserRoles {
  userRoles: ROLES[];
}

export type ActionTypes = ACTIONS | ACTIONS_TO_CLIENT;
export interface IWsData<T extends {}> {
  uuid?: string;
  payload?: T;
  to?: RequireOnlyOne<ITargetWs, 'userId' | 'groups' | 'gameId'>;
  from?: number;
}

export interface IWsMessage<T> {
  event: ActionTypes;
  data: IWsData<T>;
}

export interface ModifyWebSocket extends WebSocket, ITargetWs, IUserRoles {}

export const enum ACTIONS {
  TEST = 'TEST',
  ERROR = 'ERROR',
  CONNECTION = 'CONNECTION',
  AUTHENTICATED = 'AUTHENTICATED',
  LOGOUT = 'LOGOUT',
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
