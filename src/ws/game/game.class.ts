import { UserClass } from './user.class';
import { scatter, bg, fg } from 'ervy';
import readline from 'readline';
import { TankClass } from './tank.class';
import { DELTA_T } from '../../constants';
import { MissilesClass } from './missiles.class';

interface IMap {
  size: {
    x: number;
    y: number;
  };
}

class GameClass {
  private map: IMap;
  private userIds: number[];
  private users: { [key: number]: UserClass };
  private missiles: MissilesClass[];
  private NCycles = 0;

  constructor(users: { [key: number]: UserClass }, map: IMap) {
    const userIds = Object.keys(users).map(Number);
    userIds.forEach((key) => {
      users[key].userId = key;
    });
    this.userIds = userIds;
    this.users = users as { [key: number]: UserClass };
    this.map = map;
    this.missiles = [];
  }

  showInConsole() {
    const user1 = {
      key: 'C',
      value: [
        Math.round(this.users[this.userIds[0]].tank.x / 10),
        Math.round(this.users[this.userIds[0]].tank.y / 10),
      ],
      style: bg('cyan', 2),
      // sides: [1, 1],
    };
    const user2 = {
      key: 'B',
      value: [
        Math.round(this.users[this.userIds[1]].tank.x / 10),
        Math.round(this.users[this.userIds[1]].tank.y / 10),
      ],
      style: bg('red', 2),
    };
    const missiles = this.missiles.map((missile) => ({
      key: 'A',
      value: [Math.round(missile.x / 10), Math.round(missile.y / 10)],
      style: fg('blue', '# '),
    }));

    console.log(
      scatter([user1, user2, ...missiles], {
        legendGap: 0,
        width: this.map.size.x / 10,
        height: this.map.size.y / 10,
      }),
    );
  }

  launch() {
    setInterval(() => {
      this.NCycles += 1;
      this.userIds.map((userId) => {
        const tank = this.users[userId].tank;
        if (tank.state === 'move') {
          tank.move.calculate();
        }
      });

      this.missiles = this.missiles.filter((missile) => {
        missile.move.calculate();

        if (missile.direction === 'bottom' || missile.direction === 'top') {
          return this.map.size.y > missile.y && missile.y > 0;
        }
        return this.map.size.x > missile.x && missile.x > 0;
      });

      this.showInConsole();
      this.readKeystrokes();
    }, DELTA_T * 1000);
  }

  readKeystrokes() {
    const tank = this.users[this.userIds[0]].tank;
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (_str, key) => {
      if (key.name === 'c' && key.ctrl) {
        process.exit();
      } else if (key.name === 'up') {
        tank.changeMovement({ direction: 'top' });
      } else if (key.name === 'left') {
        tank.changeMovement({ direction: 'left' });
      } else if (key.name === 'right') {
        tank.changeMovement({ direction: 'right' });
      } else if (key.name === 'down') {
        tank.changeMovement({ direction: 'bottom' });
      } else if (key.name === 'space') {
        this.missiles.push(
          new MissilesClass({
            direction: tank.direction,
            speed: 90,
            x: tank.x,
            y: tank.y,
          }),
        );
      }
    });
  }
}

// const newGame = new GameClass(
//   {
//     42: new UserClass(
//       { teamId: '1asd' },
//       new TankClass({ x: 10, y: 10, speed: 40, direction: 'right', state: 'move' }),
//     ),
//     46: new UserClass({ teamId: '1asd' }),
//   },
//   {
//     size: { x: 300, y: 300 },
//   },
// );

// newGame.launch();
