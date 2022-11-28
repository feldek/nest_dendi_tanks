import { GameClass } from '../game.class';
import { IMapClass, MapClass } from '../map/map.class';
import readline from 'readline';
import { MissilesClass } from '../missiles.class';
import { ITankClass } from '../tank/tank.class';

class ControlClass extends GameClass {
  control: {
    [key: string]: (...any) => void;
  };

  constructor(tanks: { [key: number]: ITankClass }, map: IMapClass) {
    super(tanks, map);

    this.control = {
      up: (userId: number) => {
        const tank = this.tanks[userId];
        tank.changeMovement({ direction: 'top' });
      },
      left: (userId: number) => {
        const tank = this.tanks[userId];
        tank.changeMovement({ direction: 'left' });
      },
      right: (userId: number) => {
        const tank = this.tanks[userId];
        tank.changeMovement({ direction: 'right' });
      },
      down: (userId: number) => {
        const tank = this.tanks[userId];
        tank.changeMovement({ direction: 'bottom' });
      },
      space: (userId: number) => {
        this.tanks[userId].shot(this.missiles);
      },
      p: () => {
        if (this.gameState.paused) {
          this.gameState.resume();
        }
        this.gameState.pause();
      },
    };
  }

  startGame() {
    this.gameState.start();
    this.readKeyboard();
  }

  readKeyboard() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (_str, key) => {
      if (key.name === 'c' && key.ctrl) {
        process.exit();
      } else if (key.name) {
        this.control[key.name](this.userIds[0]);
      }
    });
  }
}

const newGame = new ControlClass(
  {
    42: { teamId: '1asd', x: 20, y: 20, speed: 40, direction: 'top', state: 'move' },
    46: { teamId: 'test', x: 10, y: 200, direction: 'top', speed: 40 },
  },

  new MapClass({
    size: { x: 300, y: 300 },
    blocks: [
      { x: 100, y: 10, currentDurability: 4 },
      { x: 100, y: 30, currentDurability: 4 },
      { x: 100, y: 50, currentDurability: 4 },
      { x: 100, y: 70, currentDurability: 4 },
      { x: 100, y: 90, currentDurability: 4 },
      { x: 100, y: 110, currentDurability: 4 },
      { x: 210, y: 250, currentDurability: 4 },
      { x: 230, y: 250, currentDurability: 4 },
      { x: 250, y: 250, currentDurability: 4 },
      { x: 270, y: 250, currentDurability: 4 },
      { x: 290, y: 250, currentDurability: 4 },
    ],
  }),
);

newGame.startGame();
