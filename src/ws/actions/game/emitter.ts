import { RequiredField } from 'src/interfaces/common';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_ACTION, REDIS_NAMESPACE } from 'src/constants/redis.constants';
import { ISchema, IWsData, ToType } from 'src/interfaces/ws';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { TTankControl } from 'src/game/tank/tank.class';
import { ACTIONS } from 'src/constants/actions.constants';

interface IEmitGame {
  [ACTIONS.JOIN_TO_GAME]: RequiredField<
    IWsData<ISchema[ACTIONS.JOIN_TO_GAME]>,
    'to' | 'uuid' | 'from'
  >;

  [ACTIONS.PAUSE_GAME]: RequiredField<IWsData<ISchema[ACTIONS.PAUSE_GAME]>, 'to' | 'uuid'>;
  [ACTIONS.TANK_MOVEMENT]: RequiredField<IWsData<TTankControl>, 'to' | 'from'>;
  [ACTIONS.TANK_SHOT]: RequiredField<IWsData, 'to' | 'from'>;
  [ACTIONS.GET_GAME_SNAPSHOT]: RequiredField<IWsData, 'to' | 'from' | 'uuid'>;
}

@Injectable()
export class EmitGame {
  constructor(@InjectRedis(REDIS_NAMESPACE.PUBLISH) readonly redisPub: Redis) {}

  private propagateGameEvent<T extends IWsData<any, ToType>>(event: ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_GAME, JSON.stringify({ event, data }));
  }

  [ACTIONS.JOIN_TO_GAME](params: IEmitGame[ACTIONS.JOIN_TO_GAME]) {
    this.propagateGameEvent(ACTIONS.JOIN_TO_GAME, params);
  }

  [ACTIONS.PAUSE_GAME](params: IEmitGame[ACTIONS.PAUSE_GAME]) {
    this.propagateGameEvent(ACTIONS.PAUSE_GAME, params);
  }

  [ACTIONS.TANK_SHOT](params: IEmitGame[ACTIONS.TANK_SHOT]) {
    this.propagateGameEvent(ACTIONS.TANK_SHOT, params);
  }

  [ACTIONS.TANK_MOVEMENT](params: IEmitGame[ACTIONS.TANK_MOVEMENT]) {
    this.propagateGameEvent(ACTIONS.TANK_MOVEMENT, params);
  }

  [ACTIONS.GET_GAME_SNAPSHOT](params: IEmitGame[ACTIONS.GET_GAME_SNAPSHOT]) {
    this.propagateGameEvent(ACTIONS.GET_GAME_SNAPSHOT, params);
  }
}
