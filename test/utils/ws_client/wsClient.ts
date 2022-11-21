import { v4 as uuidv4 } from 'uuid';
import { ACTIONS, IWsMessage } from 'src/interfaces/ws';
import WebSocket from 'ws';

const SECRET_TEST_TOKEN = 'c8dcbb8c-ee30-11ec-8ea0-0242ac120002';

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
      console.log(`userId_${userId}: `, wsData);
      // console.log(`userId${userId}: %s`, wsData.data.payload);
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
    const { to } = message;

    if (!from) {
      console.error(`this user: ${from} do not have ws connect`);
      return;
    }

    const user = this.findUser(from);

    if (user) {
      user.connection.send(JSON.stringify({ event: message.action, data: message }));
    } else {
      console.log(`userId: ${to} does not exist online`);
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
}

export const wsClient = new WsClient();

(async () => {
  try {
    await wsClient.connect(1);
    await wsClient.connect(2);
    // await wsClient.connect(3);

    await new Promise((resolve) => {
      setTimeout(() => resolve(''), 500);
    });

    await wsClient.publish(
      {
        to: { groups: ['group_test'] },
        action: ACTIONS.SEND_MSG,
        uuid: uuidv4(),
        payload: { test: 'test' },
      },
      // { to: { userId: [1] }, action: 'test', uuid: uuidv4(), payload: { test: 'test' } },
      2,
    );
    // await wsClient.publish(
    //   { to: { userId: [1] }, action: 'test', uuid: 'uuid', payload: { test: 'test' } },
    //   2,
    // );
    // await wsClient.publish(
    //   { to: { userId: [1] }, action: 'test', uuid: 'uuid', payload: { test: 'test' } },
    //   2,
    // );
  } catch (error) {
    console.log(error);
  }
})();
