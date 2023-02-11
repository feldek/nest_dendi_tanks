import { MissilesClass } from 'src/game/missiles/missiles.class';
import { RequiredField } from 'src/interfaces/common';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_ACTION, REDIS_NAMESPACE } from 'src/constants/redis.constants';
import { ISchema, IWsData, ToType } from 'src/interfaces/ws';
import { MapClass } from 'src/game/map/map.class';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { directionType } from 'src/game/common/dynamicObj.class';
import { ACTIONS } from 'src/constants/actions.constants';

type ISnapshot = {
  tanks: {
    x: number;
    y: number;
    currentArmor: number;
    direction: directionType;
    userId: number;
    teamId: string;
  }[];
  missiles: MissilesClass[];
  blocks: {
    x: number;
    y: number;
    currentDurability: number;
  }[];
};

interface IEmitClient {
  [ACTIONS.START_GAME]: RequiredField<IWsData<MapClass>, 'to' | 'uuid'>;
  [ACTIONS.PAUSE_GAME]: RequiredField<IWsData<ISchema[ACTIONS.PAUSE_GAME]>, 'to' | 'uuid'>;
  [ACTIONS.GAME_SNAPSHOT]: RequiredField<IWsData<ISnapshot>, 'to'>;
  [ACTIONS.GET_GAME_SNAPSHOT]: RequiredField<IWsData<ISnapshot, ToType>, 'to'>;
  [ACTIONS.JOIN_TO_GAME]: RequiredField<
    IWsData<{ gameId: number; message: string }>,
    'to' | 'uuid' | 'from'
  >;
  [ACTIONS.END_GAME]: RequiredField<IWsData<{ message: string; teamWin: any }>, 'to'>;
}

@Injectable()
export class EmitClient {
  constructor(@InjectRedis(REDIS_NAMESPACE.PUBLISH) readonly redisPub: Redis) {}

  private propagateClientEvent<T extends IWsData<any, ToType>>(event: ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_CLIENT, JSON.stringify({ event, data }));
  }

  propagateClientError<T extends IWsData<any, ToType> & { event: ACTIONS }>(
    event: ACTIONS.ERROR,
    data: T,
  ) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_CLIENT, JSON.stringify({ event, data }));
  }

  [ACTIONS.START_GAME](params: IEmitClient[ACTIONS.START_GAME]) {
    this.propagateClientEvent(ACTIONS.START_GAME, params);
  }

  [ACTIONS.PAUSE_GAME](params: IEmitClient[ACTIONS.PAUSE_GAME]) {
    this.propagateClientEvent(ACTIONS.PAUSE_GAME, params);
  }

  //requided from
  [ACTIONS.GET_GAME_SNAPSHOT](params: IEmitClient[ACTIONS.GET_GAME_SNAPSHOT]) {
    this.propagateClientEvent(ACTIONS.GET_GAME_SNAPSHOT, params);
  }

  [ACTIONS.GAME_SNAPSHOT](params: IEmitClient[ACTIONS.GAME_SNAPSHOT]) {
    this.propagateClientEvent(ACTIONS.GAME_SNAPSHOT, params);
  }

  [ACTIONS.JOIN_TO_GAME](params: IEmitClient[ACTIONS.JOIN_TO_GAME]) {
    this.propagateClientEvent(ACTIONS.JOIN_TO_GAME, params);
  }

  [ACTIONS.END_GAME](params: IEmitClient[ACTIONS.END_GAME]) {
    this.propagateClientEvent(ACTIONS.END_GAME, params);
  }
}
