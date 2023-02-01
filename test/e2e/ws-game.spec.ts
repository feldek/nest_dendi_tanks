import { addressForTests } from 'test/utils/configs/ws-hook';
import { maps } from './../../src/game/map/maps.constants';
import { WsClient } from '../utils/ws-client/ws-client';
import { ACTIONS } from 'src/interfaces/ws';
import { freezeTime } from 'test/utils/common';

describe('ws actions:', () => {
  const userIds = [10, 20, 30];
  let users: WsClient[] = [];

  beforeEach(() => {
    global.console = require('console');
  });

  beforeAll(async () => {
    users = userIds.map((userId) => new WsClient(userId, { port: addressForTests.port }));
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
    }: any = await users[0].sendWsPromise(ACTIONS.CREATE_NEW_GAME, {
      payload: {
        teamId: '1asd',
        state: 'move',
      },
    });

    gameId = payload.gameId;

    expect(event).toBe(ACTIONS.CREATE_NEW_GAME);
    expect(gameId).toBe(1);
  });

  it('GET_NOT_STARTED_GAMES', async () => {
    const {
      event,
      data: { payload },
    }: any = await users[0].sendWsPromise(ACTIONS.GET_NOT_STARTED_GAMES, {});

    expect(event).toBe(ACTIONS.GET_NOT_STARTED_GAMES);
    expect(gameId).toBe(payload.gameIds[0].gameId);
  });

  it('JOIN_TO_GAME', async () => {
    const {
      event,
      data: { payload, from },
    }: any = await users[1].sendWsPromise(ACTIONS.JOIN_TO_GAME, {
      payload: { gameId, teamId: 'test' },
    });

    expect(event).toBe(ACTIONS.JOIN_TO_GAME);
    expect(payload.gameId).toBe(gameId);
    expect(typeof payload.message).toBe('string');
    expect(from.userId).toBe(userIds[1]);
  });

  it('START_GAME', async () => {
    const { data }: any = await users[0].sendWsPromise(ACTIONS.START_GAME, {});

    expect(JSON.stringify(data.payload.size)).toBe(JSON.stringify(maps.testMap.size));
    expect(JSON.stringify(data.payload.blocks)).toBe(JSON.stringify(maps.testMap.blocks));
    expect(data.to.gameId).toBe(gameId);

    const pauseGame: any = await users[0].sendWsPromise(ACTIONS.PAUSE_GAME, {
      payload: {
        pause: true,
      },
    });

    expect(pauseGame.data.payload.pause).toBe(true);
    expect(pauseGame.data.to.gameId).toBe(gameId);
  });

  let yCoordinatesTank1: number;
  it('GET_GAME_SNAPSHOT', async () => {
    const pauseGame: any = await users[0].sendWsPromise(ACTIONS.PAUSE_GAME, {
      payload: {
        pause: false,
      },
    });
    expect(pauseGame.data.payload.pause).toBe(false);
    expect(pauseGame.data.to.gameId).toBe(gameId);

    const { data }: any = await users[0].sendWsPromise(ACTIONS.GET_GAME_SNAPSHOT, {});

    yCoordinatesTank1 = data.payload.tanks[0].y;
    expect(data.payload.tanks.length).toBe(2);
    expect(data.payload.missiles.length).toBe(0);

    await freezeTime(50);
    //there is tank stay
    const snapshot2: any = await users[0].sendWsPromise(ACTIONS.GET_GAME_SNAPSHOT, {});
    expect(snapshot2.data.payload.tanks[0].y).toBe(yCoordinatesTank1);
  });

  it('GET_GAME_SNAPSHOT: tank move 300ms', async () => {
    //tank move
    users[0].publish(ACTIONS.TANK_MOVEMENT, {
      payload: {
        state: 'move',
        direction: 'up',
      },
    });

    await freezeTime(300);

    const { data }: any = await users[0].sendWsPromise(ACTIONS.GET_GAME_SNAPSHOT, {});

    const yCoordinatesTank1AfterDelay = data.payload.tanks[0].y;
    expect(yCoordinatesTank1AfterDelay).toBeGreaterThan(yCoordinatesTank1);
    expect(data.payload.tanks.length).toBe(2);
    expect(data.payload.missiles.length).toBe(0);

    const pauseGame: any = await users[0].sendWsPromise(ACTIONS.PAUSE_GAME, {
      payload: {
        pause: true,
      },
    });
    expect(pauseGame.data.payload.pause).toBe(true);
    expect(pauseGame.data.to.gameId).toBe(gameId);
  });
});
