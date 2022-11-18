import { RequireOnlyOne } from './common';
import { WebSocket } from 'ws';

export interface IWsMessage {
  action: string;
  uuid: string;
  payload?: {};
  to: RequireOnlyOne<{ userId: number[]; groups: string[] }, 'userId' | 'groups'>;
  from?: number;
}

export interface ModifyWebSocket extends WebSocket {
  userId: number;
  groups: string[];
}
