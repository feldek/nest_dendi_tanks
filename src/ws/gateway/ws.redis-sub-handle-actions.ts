import { isEmpty } from 'lodash';
import { REDIS_ACTION } from 'src/constants/redis.constants';
import { ActionTypes, IWsData, ToType } from 'src/interfaces/ws';
import { WsController } from '../controller/controller';

export const redisSubHandleActions = (wsController: WsController) => {
  wsController.redisSub.on('message', (channel: REDIS_ACTION, message) => {
    const { event, data } = JSON.parse(message) as {
      event: ActionTypes;
      data: IWsData<any, ToType>;
    };

    if (channel === REDIS_ACTION.PROPAGATE_CLIENT) {
      if (!data?.to) {
        console.error('to - required parameter', message);
        return;
      }
      //check existing receiver target on wsController server (gameId, userId)
      //right now you can set only one receiver

      const checkUsers = wsController.wsGamesState.checkExistingUser.bind(wsController)(data.to);

      if (!checkUsers) {
        return;
      }

      try {
        if (!wsController.handleClient[event]) {
          throw Error(`Action name = ${event} does not exist. Message: ${message}`);
        }

        wsController.handleClient[event](wsController, data);
        return;
      } catch (error) {
        wsController.sendErrorToClient(event, {
          payload: error,
          uuid: message.uuid,
          to: data.to,
        });
      }
    } else if (channel === REDIS_ACTION.PROPAGATE_GAME) {
      if (!data?.to.gameId) {
        console.error('to.gameId -required parameter');
        return;
      }
      //skip, if unnecessary node instance
      if (!wsController.gameSessions[data.to.gameId]) {
        return;
      }

      try {
        if (!wsController.gameActions[event]) {
          throw Error(`Action name = ${event} does not exist. Message: ${message}`);
        }

        wsController.gameActions[event](wsController, data);
      } catch (error) {
        wsController.sendErrorToClient(event, {
          payload: error,
          uuid: message.uuid,
          to: data.to,
        });
      }
    } else if (channel === REDIS_ACTION.PROPAGATE_SERVER) {
      if (!data?.to.gameId) {
        console.error('to.gameId - required parameter');
        return;
      }
      try {
        if (!wsController.serverActions[event]) {
          throw Error(`Action name = ${event} does not exist. Message: ${message}`);
        }

        wsController.serverActions[event](wsController, data);
      } catch (error) {
        if (isEmpty(data.to)) {
          return;
        }

        wsController.sendErrorToClient(event, {
          payload: error,
          uuid: message.uuid,
          to: data.to,
        });
      }
    }
  });
};
