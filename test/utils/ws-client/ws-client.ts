import { ACTIONS } from '../../../src/constants/actions.constants';
import { MapClass } from './../../../src/game/map/map.class';
import { v4 as uuidv4 } from 'uuid';
import { IWsData } from 'src/interfaces/ws';
import WebSocket from 'ws';
import readline from 'readline';
import { bg, fg, scatter } from 'ervy';
import { JwtService } from '@nestjs/jwt';
import { ROLES } from 'src/constants';
import ee from 'event-emitter';
import hasListeners from 'event-emitter/has-listeners';
import { serialize } from 'bson';
import { IHandleClient } from 'src/ws/actions/client/handler';

require('dotenv').config();

const emitter = ee();

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

export class WsClient {
  map: { size: MapClass['size']; blocks: MapClass['blocks'] } = {
    blocks: [],
    size: { x: 300, y: 300 },
  };
  connection: WebSocket;
  private tankState: 'stay' | 'move' | 'hold' = 'stay';

  constructor(userId, options: { port: number }, showConsoleData = false, readKeyboard = false) {
    const connection = new WebSocket(`ws://localhost:${options.port}`);

    this.connection = connection;

    readKeyboard && this.readKeyboard();

    connection.on('open', () => {
      const jwtService = new JwtService({
        secret: process.env.ACCESS_PRIVATE_KEY,
        signOptions: {
          expiresIn: '3h',
        },
      });

      const token = jwtService.sign({ userId, userRoles: [ROLES.USER] });

      this.publish(ACTIONS.AUTHENTICATED, {
        uuid: uuidv4(),
        payload: { token },
      });
    });

    connection.on('message', (data) => {
      try {
        //@ts-ignore
        const wsData = JSON.parse(data);

        const uuid = wsData?.data.uuid;
        if (uuid) {
          emitter.emit(uuid, wsData);
        }
        // console.log(`userId ${userId} event:`, wsData.event, '\n', 'uuid:', wsData.data.uuid);

        if (showConsoleData && ACTIONS.GAME_SNAPSHOT === wsData.event) {
          const incomingBlocks = wsData.data.payload.blocks as InstanceType<
            typeof WsClient
          >['map']['blocks'];

          if (incomingBlocks.length) {
            incomingBlocks.forEach((block) => {
              const blockIndex = this.map.blocks.findIndex(
                (existingBlock) => existingBlock.y === block.y && existingBlock.x === block.x,
              );

              if (blockIndex === -1) {
                return;
              }

              if (block.currentDurability <= 0) {
                this.map.blocks.splice(blockIndex, 1);
                return;
              }

              this.map.blocks[blockIndex] = block;
            });
          }

          this.showInConsole(wsData.data.payload);

          return;
        } else if (ACTIONS.START_GAME === wsData.event) {
          this.map = wsData.data.payload;
          return;
        } else if (ACTIONS.ERROR === wsData.event) {
          console.log(`userId: ${userId} data: `, wsData.data);
          return;
        } else {
          showConsoleData &&
            console.log(`userId ${userId} event:`, wsData.event, '\n', 'uuid:', wsData.data.uuid);
          return;
        }
      } catch (error) {
        console.error(error);
      }
    });

    //remove from users list when user invoke close event
    connection.on('close', (status, msg) => {});
  }

  public publish<T>(event: ACTIONS, message: IWsData<T | void>) {
    this.connection.send(JSON.stringify({ event, data: message }));
  }

  sendWsPromise<T>(event: ACTIONS, message: IWsData<T | void>) {
    const serverExceedTimeout = 2;
    const uuid = message.uuid || uuidv4();
    message.uuid = uuid;

    return new Promise((resolve, reject) => {
      this.publish<T>(event, message);

      const callback = (data) => {
        data ? resolve(data) : reject(new Error('Unexpected server response.'));
      };

      emitter.once(uuid, callback);

      setTimeout(() => {
        if (hasListeners(emitter, uuid)) {
          reject(new Error(`Timeout exceed, ${serverExceedTimeout} sec`));
          emitter.off(uuid, callback);
        }
      }, serverExceedTimeout * 1000);
    });
  }

  //there is possible send binary data
  sendWsBinaryPromise<T>(event: ACTIONS, message: IWsData<T>) {
    const serverExceedTimeout = 2;
    const uuid = message.uuid || uuidv4();
    message.uuid = uuid;

    return new Promise((resolve, reject) => {
      //@ts-ignore
      if (message?.payload?.buffer && Buffer.isBuffer(message.payload.buffer)) {
        const serializeData = serialize({
          event,
          data: message,
        });
        this.connection.send(serializeData, { binary: true });
      } else {
        this.publish<T>(event, message);
      }

      const callback = (data) => {
        data ? resolve(data) : reject(new Error('Unexpected server response.'));
      };

      emitter.once(uuid, callback);

      setTimeout(() => {
        if (hasListeners(emitter, uuid)) {
          reject(new Error(`Timeout exceed, ${serverExceedTimeout} sec`));
          emitter.off(uuid, callback);
        }
      }, serverExceedTimeout * 1000);
    });
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
        this.tankState = 'move';
        this.publish(ACTIONS.TANK_MOVEMENT, {
          uuid: uuidv4(),
          payload: { direction: key.name, state: this.tankState },
        });
      } else if (key.name === 'space') {
        this.publish(ACTIONS.TANK_SHOT, { uuid: uuidv4() });
      } else if (key.name === '0') {
        this.tankState = this.tankState === 'stay' ? 'move' : 'stay';

        this.publish(ACTIONS.TANK_MOVEMENT, {
          uuid: uuidv4(),
          payload: { state: this.tankState },
        });
      }
    });
  }

  showInConsole(gameObjects: IHandleClient[ACTIONS.GAME_SNAPSHOT]['payload']) {
    if (!gameObjects.tanks[0]) {
      return;
    }

    const users = gameObjects.tanks.map((tank, ind) => ({
      key: tank.teamId + '_T',
      value: [Math.round(tank.x / 10), Math.round(tank.y / 10)],
      style: bg(bgColors[ind], 2),
    }));

    const landscape = this.map.blocks.map(({ x, y }) => ({
      key: 'C',
      value: [Math.round(x / 10), Math.round(y / 10)],
      style: bg('magenta', 2),
    }));
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
