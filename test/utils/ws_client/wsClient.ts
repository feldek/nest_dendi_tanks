require('dotenv').config();

import { v4 as uuidv4 } from 'uuid';
import { GAME_ACTIONS, CLIENT_ACTIONS, ActionTypes, IWsData } from 'src/interfaces/ws';
import WebSocket from 'ws';
import readline from 'readline';
import { IClientAction } from 'src/ws/gateway/actions/client-actions';
import { scatter, bg, fg } from 'ervy';

const SECRET_TEST_TOKEN = 'c8dcbb8c-ee30-11ec-8ea0-0242ac120002';

export let testGameId = 1;
export const testUserIds = [1, 46];

const bgColors = {
  '0': 'red',
  '1': 'green',
  '2': 'yellow',
  '3': 'blue',
  '4': 'magenta',
  '5': 'cyan',
  '6': 'white',
  '7': 'black',
};

class WsClient {
  public users: { connection: WebSocket; userId: number }[] = [];

  async connect(userId: number, showInConsole = true) {
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
      if (wsData.event === CLIENT_ACTIONS.CREATE_NEW_GAME) {
        testGameId = wsData.data.payload.gameId;
        return;
      } else if (CLIENT_ACTIONS.GAME_SNAPSHOT === wsData.event) {
        // console.log(wsData.data.payload);

        showInConsole && this.showInConsole(wsData.data.payload);
        return;
      } else if ([CLIENT_ACTIONS.AUTHENTICATED].includes(wsData.event)) {
        return;
      } else if (CLIENT_ACTIONS.ERROR === wsData.event) {
        console.log(`userId ${userId} event:`, wsData.event, '\n', wsData.data.payload);
        return;
      }
      // console.log(`userId ${userId} event:`, wsData.event);
      // console.log(`userId ${userId}:`, wsData.data.payload, '\n');
      // console.log(`userId ${userId} event:`, wsData.event, '\n', wsData.data.payload);
    });

    //remove from users list when user invoke close event
    connection.on('close', (status, msg) => {
      //status = 3000 unauthorized
      //reason closing ws
      const id = this.users.indexOf(user);
      this.users.splice(id, 1);
    });
  }

  public publish<T>(event: ActionTypes, message: IWsData<T>, from: number) {
    if (!from) {
      console.error(`this user: ${from} do not have ws connect`);
      return;
    }

    const user = this.findUser(from);

    if (user) {
      user.connection.send(JSON.stringify({ event, data: message }));
    } else {
      console.log(`userId: ${message?.to} does not exist online`);
    }
  }

  public close(userId: number | number[]) {
    let userIds: number[] = [];
    if (typeof userId === 'number') {
      userIds = [userId];
    } else if (Array.isArray(userIds)) {
      userIds = userId;
    }

    userIds.forEach((userId) => {
      const user = this.findUser(userId);
      if (user) {
        user.connection.close();
      } else {
        console.log(`userId: ${user} does not exist online`);
      }
    });
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
          GAME_ACTIONS.TANK_MOVEMENT,
          {
            uuid: uuidv4(),
            payload: { direction: key.name },
          },
          testUserIds[0],
        );
      } else if (key.name === 'space') {
        this.publish(GAME_ACTIONS.TANK_SHOT, { uuid: uuidv4() }, testUserIds[0]);
      }
    });
  }

  showInConsole(gameObjects: IClientAction[CLIENT_ACTIONS.GAME_SNAPSHOT]['payload']) {
    if (!gameObjects.tanks[0]) {
      return;
    }

    const users = gameObjects.tanks.map((tank, ind) => ({
      key: tank.teamId + '_T',
      value: [Math.round(tank.x / 10), Math.round(tank.y / 10)],
      style: bg(bgColors[ind], 2),
    }));

    // const landscape = gameObjects.map.blocks.map(({ x, y }) => ({
    //   key: 'C',
    //   value: [Math.round(x / 10), Math.round(y / 10)],
    //   style: bg('magenta', 2),
    // }));
    const landscape = [];
    const missiles = gameObjects.missiles.map((missile) => ({
      key: 'D',
      value: [Math.round(missile.x / 10), Math.round(missile.y / 10)],
      style: fg('blue', '*'),
    }));

    const renderObj = landscape.concat(missiles).concat(users);

    
    console.log(
      scatter(renderObj, {
        legendGap: 0,
        width: 30,
        height: 30,
      }),
    );
  }
}

export const wsClient = new WsClient();
