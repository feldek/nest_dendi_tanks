import { JwtService } from '@nestjs/jwt';
import { CLIENT_ACTIONS, GAME_ACTIONS } from 'src/interfaces/ws';
import { testGameId, testUserIds, wsClient } from './wsClient';
import { v4 as uuidv4 } from 'uuid';
import { ROLES } from 'src/constants';

const jwtService = new JwtService({
  secret: process.env.ACCESS_PRIVATE_KEY,
  signOptions: {
    expiresIn: '3h',
  },
});

const tokenUser1 = jwtService.sign({ userId: testUserIds[0], userRoles: [ROLES.USER] });
const tokenUser2 = jwtService.sign({ userId: testUserIds[1], userRoles: [ROLES.USER] });

const launchFile = async () => {
  try {
    await wsClient.connect(testUserIds[0]);
    await wsClient.connect(testUserIds[1], false);

    wsClient.readKeyboard();

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 300);
    });

    wsClient.publish(
      CLIENT_ACTIONS.AUTHENTICATED,
      {
        uuid: uuidv4(),
        payload: { token: tokenUser1 },
      },
      testUserIds[0],
    );
    wsClient.publish(
      CLIENT_ACTIONS.AUTHENTICATED,
      {
        uuid: uuidv4(),
        payload: { token: tokenUser2 },
      },
      testUserIds[1],
    );
    // return;
    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 300);
    });

    // wsClient.publish(
    //   ACTIONS.TEST,
    //   {
    //     uuid: uuidv4(),
    //     payload: {
    //       email: 'oneTest@gmail.com',
    //       password: 'testPassword',
    //     },
    //   },
    //   testUserIds[0],
    // );
    // return;
    wsClient.publish(
      GAME_ACTIONS.CREATE_NEW_GAME,
      {
        uuid: uuidv4(),
        payload: {
          teamId: '1asd',
          state: 'move',
        },
      },
      testUserIds[0],
    );
    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 100);
    });
    // return;
    wsClient.publish(
      GAME_ACTIONS.GET_NOT_STARTED_GAMES,
      {
        uuid: uuidv4(),
      },
      testUserIds[1],
    );
    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 100);
    });
    // return;

    wsClient.publish(
      GAME_ACTIONS.JOIN_TO_GAME,
      {
        uuid: uuidv4(),
        payload: { gameId: testGameId, teamId: 'test' },
      },
      testUserIds[1],
    );

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 300);
    });

    wsClient.publish(
      GAME_ACTIONS.START_GAME,
      {
        uuid: uuidv4(),
      },
      testUserIds[0],
    );

    return;
    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 5 * 1000);
    });
    // wsClient.readKeyboard();

    // await new Promise((resolve) => {
    //   setTimeout(() => resolve(''), 10 * 1000);
    // });
    wsClient.publish(GAME_ACTIONS.PAUSE_GAME, { uuid: uuidv4() }, testUserIds[0]);

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 5 * 1000);
    });

    wsClient.publish(GAME_ACTIONS.PAUSE_GAME, { uuid: uuidv4() }, testUserIds[0]);
    // wsClient.publish(
    //   {
    //     event: ACTIONS.FORCE_END_GAME,
    //     uuid: uuidv4(),
    //     payload: { gameId },
    //   },
    //   testUserIds[0],
    // );
  } catch (error) {
    console.log(error);
  }
};

launchFile();
