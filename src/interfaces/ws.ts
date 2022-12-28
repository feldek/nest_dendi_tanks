import { WsErrorType } from 'src/middlewares/ws.interceptor';
import { RequiredField, RequireOnlyOne } from './common';
import { WebSocket } from 'ws';
import { ROLES } from 'src/constants';
import { ITankClass, TTankControl } from 'src/ws/game/tank/tank.class';
import { TGameId } from 'src/ws/game/game-sessions.class';

interface ITargetWs {
  userId: number | null;
  groups: string[];
  gameId: number | null;
}

interface IUserRoles {
  userRoles: ROLES[];
}

export type ToType = RequireOnlyOne<
  //broadcast - send all users
  ITargetWs & { broadcast: boolean },
  'userId' | 'groups' | 'gameId' | 'broadcast'
>;
export type ActionTypes = GAME_ACTIONS | CLIENT_ACTIONS | SERVER_ACTIONS;

type PayloadType = { [key: string | number]: any };
export interface IWsData<
  P extends PayloadType,
  T extends ToType = { gameId: ITargetWs['gameId'] },
  F extends { userId: number } = { userId: number },
> {
  uuid?: string;
  payload?: P;
  to?: T;
  from?: F;
}

export type IRequiredTo<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: ITargetWs['gameId'] },
  F extends { userId: number } = { userId: number },
> = P extends PayloadType
  ? RequiredField<IWsData<P, T, F>, 'to' | 'payload'>
  : RequiredField<IWsData<{}, T, F>, 'to'>;

export type IRequiredToFrom<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: ITargetWs['gameId'] },
  F extends { userId: number } = { userId: number },
> = P extends PayloadType
  ? RequiredField<IWsData<P, T, F>, 'to' | 'from' | 'payload'>
  : RequiredField<IWsData<{}, T, F>, 'to' | 'from'>;

export interface IWsMessage<T> {
  event: ActionTypes;
  data: IWsData<T>;
}

export interface ModifyWebSocket extends WebSocket, ITargetWs, IUserRoles {
  isGameHost: boolean;

  sendError: (data: WsErrorType) => void;
}

export const enum GAME_ACTIONS {
  TEST = 'TEST',
  ERROR = 'ERROR',
  CONNECTION = 'CONNECTION',
  SEND_MSG = 'SEND_MSG',
  CREATE_NEW_GAME = 'CREATE_NEW_GAME',
  START_GAME = 'START_GAME',
  PAUSE_GAME = 'PAUSE_GAME',
  JOIN_TO_GAME = 'JOIN_TO_GAME1',
  FORCE_END_GAME = 'FORCE_END_GAME',
  GET_NOT_STARTED_GAMES = 'GET_NOT_STARTED_GAMES',
  TANK_MOVEMENT = 'TANK_MOVEMENT',
  TANK_SHOT = 'TANK_SHOT',
}

export const enum CLIENT_ACTIONS {
  AUTHENTICATED = 'AUTHENTICATED',
  LOGOUT = 'LOGOUT',
  ERROR = 'ERROR',
  JOIN_TO_GAME = 'JOIN_TO_GAME',
  CREATE_NEW_GAME = 'CREATE_NEW_GAME',
  PAUSE_GAME = 'PAUSE_GAME',
  USER_JOIN_TO_GAME = 'USER_JOIN_TO_GAME',
  SET_GAME_DATA = 'SET_GAME_DATA',
  GAME_SNAPSHOT = 'GAME_SNAPSHOT',
  END_GAME = 'END_GAME',
}

export const enum SERVER_ACTIONS {
  ERROR = 'ERROR',
  START_GAME = 'START_GAME',
  CREATE_NEW_GAME = 'CREATE_NEW_GAME',
  JOIN_TO_GAME = 'JOIN_TO_GAME',
  LEAVE_GAME = 'LEAVE_GAME',
  FORCE_END_GAME = 'FORCE_END_GAME',
  GAME_SNAPSHOT = 'GAME_SNAPSHOT',
  END_GAME = 'END_GAME',
}

export interface ISchema {
  [GAME_ACTIONS.TEST]: { email: string; password: string };
  [GAME_ACTIONS.CREATE_NEW_GAME]: Omit<ITankClass, 'userId'>;
  [GAME_ACTIONS.JOIN_TO_GAME]: Omit<ITankClass, 'userId'> & { gameId: TGameId };
  [GAME_ACTIONS.FORCE_END_GAME]: { gameId: TGameId };
  [GAME_ACTIONS.TANK_MOVEMENT]: TTankControl;
  [GAME_ACTIONS.PAUSE_GAME]: { pause: boolean };

  [CLIENT_ACTIONS.AUTHENTICATED]: { token: string };
}
