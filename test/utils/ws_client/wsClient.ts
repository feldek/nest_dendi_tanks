import { v4 as uuidv4 } from 'uuid';
import { ACTIONS, ACTIONS_TO_CLIENT, IWsMessage } from 'src/interfaces/ws';
import WebSocket from 'ws';
import readline from 'readline';

const SECRET_TEST_TOKEN = 'c8dcbb8c-ee30-11ec-8ea0-0242ac120002';

let gameId = 1;
const userIds = [42, 46];
class WsClient {
  public users: { connection: WebSocket; userId: number }[] = [];

  async connect(userId: number) {
    const connection = new WebSocket(`ws://localhost:8000`, {
      headers: { userid: userId, authorization: SECRET_TEST_TOKEN },
    });
    const user = { connection, userId };
    this.users.push(user);

    connection.on('open', () => {
      console.log('connection on');

      //
    });

    // there user get messages
    connection.on('message', (data) => {
      //@ts-ignore
      const wsData = JSON.parse(data);
      if (wsData.event === ACTIONS_TO_CLIENT.SET_GAME_ID) {
        gameId = wsData.data.payload.gameId;
      }

      // console.log(`userId ${userId}:`, wsData.data.payload);
      console.log(`userId ${userId}:`, wsData.data);
    });

    //remove from users list when user invoke close event
    connection.on('close', (status, msg) => {
      //status = 3000 unauthorized
      //reason closing ws
      // const message = JSON.parse(msg.toString());

      const id = this.users.indexOf(user);
      this.users.splice(id, 1);
    });
  }

  // from - userId who send message
  // to   - userId/groups array who accept message
  public publish<T>(message: IWsMessage<T>, from: number) {
    const { event, ...data } = message;

    if (!from) {
      console.error(`this user: ${from} do not have ws connect`);
      return;
    }

    const user = this.findUser(from);

    if (user) {
      user.connection.send(JSON.stringify({ event: message.event, data }));
    } else {
      console.log(`userId: ${message?.to} does not exist online`);
    }
  }

  public close(userId: number) {
    const user = this.findUser(userId);
    if (user) {
      user.connection.close();
    } else {
      console.log(`userId: ${user} does not exist online`);
    }
  }

  public findUser(userId: number) {
    return this.users.find((user) => user.userId === userId);
  }

  readKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (_str, key) => {
      if (key.name === 'c' && key.ctrl) {
        process.exit();
      } else if (
        key.name === 'up' ||
        key.name === 'down' ||
        key.name === 'left' ||
        key.name === 'right'
      ) {
        this.publish(
          {
            event: ACTIONS.TANK_MOVEMENT,
            uuid: uuidv4(),
            payload: { direction: key.name },
          },
          userIds[0],
        );
      } else if (key.name === 'space') {
        this.publish({ event: ACTIONS.TANK_SHOT, uuid: uuidv4() }, userIds[0]);
      }
    });
  }
}

export const wsClient = new WsClient();

(async () => {
  try {
    await wsClient.connect(userIds[0]);
    await wsClient.connect(userIds[1]);
    // await wsClient.connect(3);

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 500);
    });

    await wsClient.publish(
      {
        //@ts-ignore
        event: 'TEST',
        uuid: uuidv4(),
        // email: 'oneTestgmail.com',
        // password: '456789A',
        // userName: 'test',
        payload: {
          email: 'oneTest@gmail.com',
          password: 'testPassword',
          // lol: 'qwe',
        },
      },
      userIds[0],
    );
    return;
    await wsClient.publish(
      {
        // to: { userId: ['group_test'] },
        event: ACTIONS.CREATE_NEW_GAME,
        uuid: uuidv4(),
        payload: {
          // userId: userIds[0],
          teamId: '1asd',
          x: 20,
          y: 20,
          speed: 40,
          direction: 'up',
          state: 'move',
        },
      },
      userIds[0],
    );
    await wsClient.publish(
      {
        event: ACTIONS.GET_NOT_STARTED_GAMES,
        uuid: uuidv4(),
      },
      userIds[1],
    );

    // return;
    // await wsClient.publish(
    //   {
    //     event: ACTIONS.JOIN_TO_GAME,
    //     uuid: uuidv4(),
    //     payload: {
    //       gameId,
    //       userId: userIds[1],
    //       teamId: 'test',
    //       x: 10,
    //       y: 200,
    //       direction: 'up',
    //       speed: 40,
    //     },
    //   },
    //   userIds[1],
    // );
    // await new Promise((resolve) => {
    //   setTimeout(() => resolve(''), 1000);
    // });

    await wsClient.publish(
      {
        event: ACTIONS.START_GAME,
        uuid: uuidv4(),
        payload: { gameId },
      },
      userIds[0],
    );

    wsClient.readKeyboard();

    // await new Promise((resolve) => {
    //   setTimeout(() => resolve(''), 10 * 1000);
    // });
    // await wsClient.publish(
    //   {
    //     event: ACTIONS.FORCE_END_GAME,
    //     uuid: uuidv4(),
    //     payload: { gameId },
    //   },
    //   userIds[0],
    // );
  } catch (error) {
    console.log(error);
  }
})();
// (async () => {
//   try {
//     await wsClient.connect(42);
//     await wsClient.connect(46);
//     // await wsClient.connect(3);

//     await new Promise((resolve) => {
//       setTimeout(() => resolve(''), 500);
//     });

//     await wsClient.publish(
//       {
//         // to: { userId: ['group_test'] },
//         action: ACTIONS.CREATE_NEW_GAME,
//         uuid: uuidv4(),
//         // payload: { test: 'test' },
//       },
//       // { to: { userId: [1] }, action: 'test', uuid: uuidv4(), payload: { test: 'test' } },
//       42,
//     );
//     // await wsClient.publish(
//     //   { to: { userId: [1] }, action: 'test', uuid: 'uuid', payload: { test: 'test' } },
//     //   2,
//     // );
//     // await wsClient.publish(
//     //   { to: { userId: [1] }, action: 'test', uuid: 'uuid', payload: { test: 'test' } },
//     //   2,
//     // );
//   } catch (error) {
//     console.log(error);
//   }
// })();
