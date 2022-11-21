import { RequireOnlyOne } from './common';
import { WebSocket } from 'ws';

export interface IWsMessage<T extends {}> {
  action: ACTIONS;
  uuid: string;
  payload?: T;
  to: RequireOnlyOne<{ userId: number[]; groups: string[] }, 'userId' | 'groups'>;
  from?: number;
}

export interface ModifyWebSocket extends WebSocket {
  userId: number;
  groups: string[];
}

export const enum ACTIONS {
  CONNECTION = 'CONNECTION',
  SEND_MSG = 'SEND_MSG',
}
