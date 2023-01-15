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
export type ActionTypes = ACTIONS;

type PayloadType = { [key: string | number]: any };

interface IDataTest<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: ITargetWs['gameId'] },
  F extends { userId: number } = { userId: number },
> {
  uuid?: string;
  payload?: P;
  to?: T;
  from?: F;
}

export type IWsData<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: ITargetWs['gameId'] },
  F extends { userId: number } = { userId: number },
> = P extends PayloadType ? RequiredField<IDataTest<P, T, F>, 'payload'> : IDataTest<void, T, F>;

export type IRequiredTo<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: ITargetWs['gameId'] },
  F extends { userId: number } = { userId: number },
> = P extends PayloadType
  ? RequiredField<IWsData<P, T, F>, 'to' | 'payload'>
  : RequiredField<IWsData<void, T, F>, 'to'>;

export type IRequiredToFrom<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: ITargetWs['gameId'] },
  F extends { userId: number } = { userId: number },
> = P extends PayloadType
  ? RequiredField<IWsData<P, T, F>, 'to' | 'from' | 'payload'>
  : RequiredField<IWsData<void, T, F>, 'to' | 'from'>;

export interface IWsMessage<T> {
  event: ActionTypes;
  data: IWsData<T>;
}

export interface ModifyWebSocket extends WebSocket, ITargetWs, IUserRoles {
  isGameHost: boolean;

  sendError: (data: WsErrorType) => void;
}

export const enum ACTIONS {
  TEST = 'TEST',
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
  END_GAME = 'END_GAME',

  AUTHENTICATED = 'AUTHENTICATED',
  LOGOUT = 'LOGOUT',
  USER_JOIN_TO_GAME = 'USER_JOIN_TO_GAME',
  GAME_SNAPSHOT = 'GAME_SNAPSHOT',
  GET_GAME_SNAPSHOT = 'GET_GAME_SNAPSHOT',
  LEAVE_GAME = 'LEAVE_GAME',
  LOAD_IMAGE_TEST = 'LOAD_IMAGE_TEST',
}

export interface ISchema {
  [ACTIONS.TEST]: { email: string; password: string };
  [ACTIONS.CREATE_NEW_GAME]: Omit<ITankClass, 'userId'>;
  [ACTIONS.JOIN_TO_GAME]: Omit<ITankClass, 'userId'> & { gameId: TGameId };
  [ACTIONS.FORCE_END_GAME]: { gameId: TGameId };
  [ACTIONS.TANK_MOVEMENT]: TTankControl;
  [ACTIONS.PAUSE_GAME]: { pause: boolean };
  [ACTIONS.AUTHENTICATED]: { token: string };
}
