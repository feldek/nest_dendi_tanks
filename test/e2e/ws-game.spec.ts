import 'test/utils/configs/ws-hook';

import { WsClient } from '../utils/ws-client/ws-client';
import { GAME_ACTIONS } from 'src/interfaces/ws';
import { freezeTime } from 'test/utils/common';

describe('ws', () => {
  const userIds = [10, 20];
  let users: WsClient[] = [];

  beforeEach(() => {
    global.console = require('console');
  });

  beforeAll(async () => {
    users = userIds.map((userId) => new WsClient(userId));
    await freezeTime(300);
  });

  afterAll(async () => {
    users.forEach((user) => user.connection.close());
  });

  let gameId;

  it('CREATE_NEW_GAME', async () => {
    const {
      event,
      data: { payload },
    } = (await users[0].sendWsPromise(GAME_ACTIONS.CREATE_NEW_GAME, {
      payload: {
        teamId: '1asd',
        state: 'move',
      },
    })) as any;

    gameId = payload.gameId;

    expect(event).toBe(GAME_ACTIONS.CREATE_NEW_GAME);
    expect(gameId).toBe(1);
  });

  it('GET_NOT_STARTED_GAMES', async () => {
    const {
      event,
      data: { payload },
    } = (await users[0].sendWsPromise(GAME_ACTIONS.GET_NOT_STARTED_GAMES, {})) as any;

    expect(event).toBe(GAME_ACTIONS.GET_NOT_STARTED_GAMES);
    expect(gameId).toBe(payload.gameIds[0].gameId);
  });

  it('JOIN_TO_GAME', async () => {
    const {
      event,
      data: { payload, from },
    } = (await users[1].sendWsPromise(GAME_ACTIONS.JOIN_TO_GAME, {
      payload: { gameId, teamId: 'test' },
    })) as any;

    expect(event).toBe(GAME_ACTIONS.JOIN_TO_GAME);
    expect(payload.gameId).toBe(gameId);
    expect(typeof payload.message).toBe('string');
    expect(from.userId).toBe(userIds[1]);
  });

  it('START_GAME', async () => {
    const { data }: any = await users[0].sendWsPromise(GAME_ACTIONS.START_GAME, {});

    expect(typeof data.payload.message).toBe('string');
    expect(data.to.gameId).toBe(gameId);

    const pauseGame: any = await users[0].sendWsPromise(GAME_ACTIONS.PAUSE_GAME, {
      payload: {
        pause: true,
      },
    });

    expect(pauseGame.data.payload.pause).toBe(true);
    expect(pauseGame.data.to.gameId).toBe(gameId);
  });
});
