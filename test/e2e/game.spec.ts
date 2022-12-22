require('dotenv').config();
// import { request } from 'test/utils/configs/hook';

import { v4 as uuidv4 } from 'uuid';
import { ROLES } from 'src/constants';
import { wsClient } from 'test/utils/ws_client/wsClient';
import { JwtService } from '@nestjs/jwt';
import { CLIENT_ACTIONS, GAME_ACTIONS } from 'src/interfaces/ws';

describe('user/', () => {
  const userIds = [10, 20, 30];

  beforeEach(() => {
    global.console = require('console');
  });

  beforeAll(async () => {
    await Promise.all(userIds.map((userId) => wsClient.connect(userId)));

    const jwtService = new JwtService({
      secret: process.env.ACCESS_PRIVATE_KEY,
      signOptions: {
        expiresIn: '3h',
      },
    });

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 300);
    });

    userIds.map((userId) => {
      const token = jwtService.sign({ userId, userRoles: [ROLES.USER] });
      wsClient.publish(
        CLIENT_ACTIONS.AUTHENTICATED,
        { uuid: uuidv4(), payload: { token } },
        userId,
      );
    });

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 300);
    });
  });

  afterAll(() => {
    wsClient.close(userIds);
  });

  it('/ (get) created and return users', async () => {
    wsClient.publish(
      GAME_ACTIONS.CREATE_NEW_GAME,
      {
        uuid: uuidv4(),
        payload: {
          teamId: '1asd',
          state: 'move',
        },
      },
      userIds[0],
    );

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 100);
    });

    wsClient.publish(
      GAME_ACTIONS.GET_NOT_STARTED_GAMES,
      {
        uuid: uuidv4(),
      },
      userIds[1],
    );

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 500);
    });
    // done();
  });
});
