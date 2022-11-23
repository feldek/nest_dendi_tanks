import { UserClass } from './user.class';
import { scatter, bg, fg } from 'ervy';
import readline from 'readline';
import { DELTA_T } from '../../constants';
import { MissilesClass } from './missiles.class';
import { IMapClass, MapClass } from './map.class';

export const LANDSCAPE_RADIUS = 10;
export const MISSILES_RADIUS = 3;
export const MISSILES_LANDSCAPE_RADIUS = LANDSCAPE_RADIUS + MISSILES_RADIUS;

class GameClass {
  private map: MapClass;
  private userIds: number[];
  private users: { [key: number]: UserClass };
  private missiles: MissilesClass[];
  private NCycles = 0;

  constructor(users: { [key: number]: UserClass }, map: IMapClass) {
    const userIds = Object.keys(users).map(Number);
    userIds.forEach((key) => {
      users[key].userId = key;
    });
    this.userIds = userIds;
    this.users = users as { [key: number]: UserClass };
    this.map = new MapClass(map);
    this.missiles = [];
  }

  showInConsole() {
    const user1 = {
      key: 'A',
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

    const landscape = this.map.blocks.map(({ x, y }) => ({
      key: 'C',
      value: [Math.round(x / 10), Math.round(y / 10)],
      style: bg('magenta', 2),
    }));
    const missiles = this.missiles.map((missile) => ({
      key: 'D',
      value: [Math.round(missile.x / 10), Math.round(missile.y / 10)],
      style: fg('blue', '*'),
    }));

    const renderObj = landscape.concat(missiles);
    renderObj.push(user1);
    renderObj.push(user2);

    console.log(
      scatter(renderObj, {
        legendGap: 0,
        width: this.map.size.x / 10,
        height: this.map.size.y / 10,
      }),
    );
  }

  launch() {
    setInterval(() => {
      this.NCycles += 1;

      //calculated new tank coordinates
      this.userIds.some((userId) => {
        this.users[userId].tank.calculateCoordinates(this.map.size);
      });

      this.missiles = this.missiles.filter((missile) => {
        //calculate new missiles coordinates
        missile.move.calculate();

        // remove missiles if missiles move to end of the map
        if (!missile.checkEndMap(this.map.size)) {
          return false;
        }

        const hitToTank = this.userIds.some((userId) => {
          //if missiles this user's, then skip this iterations
          //TODO: how will interaction with teammates?
          if (userId === missile.userId) {
            return false;
          }

          const user = this.users[userId];
          return user.missilesHitToTank(missile);
        });

        if (hitToTank) {
          return false;
        }

        const missileHit = this.map.checkMissileHitToLandscape({ x: missile.x, y: missile.y });
        //we used inverted value, because if hit was been, then need return false, for deleting missile
        return !missileHit;
      });

      this.showInConsole();
      this.readKeyboard();
    }, DELTA_T * 1000);
  }

  readKeyboard() {
    const userId = this.userIds[0];
    const tank = this.users[userId].tank;
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
            speed: tank.weapon.speed,
            x: tank.x,
            y: tank.y,
            userId,
            teamId: this.users[userId].teamId,
            damage: tank.weapon.damage,
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
//       new TankClass({ x: 10, y: 10, speed: 40, direction: 'top', state: 'move' }),
//     ),
//     46: new UserClass(
//       { teamId: 'test' },
//       new TankClass({ x: 10, y: 200, direction: 'top', speed: 40 }),
//     ),
//   },

//   new MapClass({
//     size: { x: 300, y: 300 },
//     blocks: [
//       { x: 100, y: 10 },
//       { x: 100, y: 30 },
//       { x: 100, y: 50 },
//       { x: 100, y: 70 },
//       { x: 100, y: 90 },
//       { x: 100, y: 110 },
//       { x: 210, y: 250 },
//       { x: 230, y: 250 },
//       { x: 250, y: 250 },
//       { x: 270, y: 250 },
//       { x: 290, y: 250 },
//     ],
//   }),
// );

// newGame.launch();
