import { RequiredField } from 'src/interfaces/common';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_ACTION, REDIS_NAMESPACE } from 'src/constants/redis.constants';
import { ACTIONS, IWsData, ToType } from 'src/interfaces/ws';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

interface IEmitServer {
  [ACTIONS.CREATE_NEW_GAME]: RequiredField<IWsData<{ userId: number }>, 'to'>;
  [ACTIONS.START_GAME]: RequiredField<IWsData, 'to'>;
  [ACTIONS.END_GAME]: RequiredField<IWsData, 'to'>;
  [ACTIONS.JOIN_TO_GAME]: RequiredField<IWsData<{ userId: number }>, 'to' | 'uuid'>;
}

@Injectable()
export class EmitServer {
  constructor(@InjectRedis(REDIS_NAMESPACE.PUBLISH) readonly redisPub: Redis) {}

  private propagateServerEvent<T extends IWsData<any, ToType>>(event: ACTIONS, data: T) {
    this.redisPub.publish(REDIS_ACTION.PROPAGATE_SERVER, JSON.stringify({ event, data }));
  }

  [ACTIONS.CREATE_NEW_GAME](params: IEmitServer[ACTIONS.CREATE_NEW_GAME]) {
    this.propagateServerEvent(ACTIONS.CREATE_NEW_GAME, params);
  }

  [ACTIONS.START_GAME](params: IEmitServer[ACTIONS.START_GAME]) {
    this.propagateServerEvent(ACTIONS.START_GAME, params);
  }

  [ACTIONS.END_GAME](params: IEmitServer[ACTIONS.END_GAME]) {
    this.propagateServerEvent(ACTIONS.END_GAME, params);
  }

  [ACTIONS.JOIN_TO_GAME](params: IEmitServer[ACTIONS.JOIN_TO_GAME]) {
    this.propagateServerEvent(ACTIONS.JOIN_TO_GAME, params);
  }
}
