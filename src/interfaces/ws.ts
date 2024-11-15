import { WsErrorType } from 'src/middlewares/ws.interceptor';
import { RequiredField, RequireOnlyOne } from './common';
import { WebSocket } from 'ws';
import { ROLES } from 'src/constants';
import { ITankClass, TTankControl } from 'src/game/tank/tank.class';
import { TGameId } from 'src/game/game-sessions.class';
import { ACTIONS } from '../constants/actions.constants';

interface IClientMetadata {
  userId: number | null;
  groups: string[];
  gameId: number | null;
}

interface IUserRoles {
  userRoles: ROLES[];
}

export type ToTypeKeys = 'userId' | 'groups' | 'gameId' | 'broadcast' | 'userIds';
export type ToType = RequireOnlyOne<
  //broadcast - send all users
  IClientMetadata & { broadcast: boolean } & { userIds: number[] },
  'userId' | 'groups' | 'gameId' | 'broadcast' | 'userIds'
>;

type PayloadType = { [key: string | number]: any };

interface IDataTest<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: IClientMetadata['gameId'] },
  F extends { userId: number } = { userId: number },
> {
  uuid?: string;
  payload?: P;
  to?: T;
  from?: F;
}

export type IWsData<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: IClientMetadata['gameId'] },
  F extends { userId: number } = { userId: number },
> = P extends PayloadType ? RequiredField<IDataTest<P, T, F>, 'payload'> : IDataTest<void, T, F>;

export type IRequiredTo<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: IClientMetadata['gameId'] },
  F extends { userId: number } = { userId: number },
> = P extends PayloadType
  ? RequiredField<IWsData<P, T, F>, 'to' | 'payload'>
  : RequiredField<IWsData<void, T, F>, 'to'>;

export type IRequiredToFrom<
  P extends PayloadType | void = void,
  T extends ToType = { gameId: IClientMetadata['gameId'] },
  F extends { userId: number } = { userId: number },
> = P extends PayloadType
  ? RequiredField<IWsData<P, T, F>, 'to' | 'from' | 'payload'>
  : RequiredField<IWsData<void, T, F>, 'to' | 'from'>;

export interface IWsMessage<T> {
  event: ACTIONS;
  data: IWsData<T>;
}

export interface ModifyWebSocket extends WebSocket, IClientMetadata, IUserRoles {
  isGameHost: boolean;

  sendError: (data: WsErrorType) => void;
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
