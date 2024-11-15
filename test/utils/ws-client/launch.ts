import { WsClient } from './ws-client';
import { freezeTime } from '../common';
import { ACTIONS } from '../../../src/constants/actions.constants';

const userIds = [10, 20, 30];

const bootstrapConsoleGame = async () => {
  try {
    const users = userIds.map((userId) => {
      const showConsoleUi = userId === userIds[0] ? true : false;
      return new WsClient(userId, { port: 8000 }, showConsoleUi, showConsoleUi);
    });

    await freezeTime(500);

    const createNewGame: any = await users[0].sendWsPromise(ACTIONS.CREATE_NEW_GAME, {
      payload: {
        teamId: 'my_team',
        state: 'move',
      },
    });

    const gameId = createNewGame.data.payload.gameId as number;

    await users[1].sendWsPromise(ACTIONS.JOIN_TO_GAME, {
      payload: { gameId, teamId: 'other_team', x: 200, y: 200 },
    });

    await users[0].sendWsPromise(ACTIONS.START_GAME, {});
  } catch (error) {
    console.log(error);
  }
};

bootstrapConsoleGame();
