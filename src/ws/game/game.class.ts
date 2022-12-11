import { IntervalTimer } from './common/interval.class';
import { ITankClass, TankClass } from './tank/tank.class';
import { scatter, bg, fg } from 'ervy';
import { DELTA_T } from '../../constants';
import { MissilesClass } from './missiles/missiles.class';
import { MapClass } from './map/map.class';
import { ACTIONS_TO_CLIENT } from 'src/interfaces/ws';

//where key - userId
export type GameTanksConstructor = ITankClass[];
export type TGameTanks = { [key: number]: TankClass };

export class GameClass {
  map: MapClass;
  userIds: number[];
  tanks: TGameTanks;
  missiles: MissilesClass[];
  gameState: IntervalTimer;
  gameStarted: boolean = false;

  constructor(tanks: ITankClass[], map: MapClass) {
    const tankInstances: TGameTanks = {};
    tanks.forEach((tank) => {
      tankInstances[tank.userId] = new TankClass(tank, this.checkEndGame.bind(this));
    });

    this.userIds = tanks.map((tank) => tank.userId);
    this.tanks = tankInstances;
    this.map = map;
    this.missiles = [];
    this.gameState = new IntervalTimer(() => this.calculateOneStep(), DELTA_T * 1000);
  }

  showInConsole() {
    const user1 = {
      key: 'A',
      value: [
        Math.round(this.tanks[this.userIds[0]].x / 10),
        Math.round(this.tanks[this.userIds[0]].y / 10),
      ],
      style: bg('cyan', 2),
      // sides: [1, 1],
    };
    // const user2 = {
    //   key: 'B',
    //   value: [
    //     Math.round(this.tanks[this.userIds[1]].x / 10),
    //     Math.round(this.tanks[this.userIds[1]].y / 10),
    //   ],
    //   style: bg('red', 2),
    // };

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
    // renderObj.push(user2);

    console.log(
      scatter(renderObj, {
        legendGap: 0,
        width: this.map.size.x / 10,
        height: this.map.size.y / 10,
      }),
    );
  }

  calculateOneStep() {
    //calculated new tank coordinates
    this.userIds.forEach((userId) => {
      const tank = this.tanks[userId];

      const landscapeIntersection = this.map.blocks.some((block) =>
        tank.intersectionLandscape(block),
      );

      if (!landscapeIntersection) {
        tank.calculateCoordinates(this.map.size);
      }
    });

    this.missiles = this.missiles.filter((missile) => {
      //calculate new missiles coordinates
      missile.move.calculate();

      // remove missiles if missiles move to end of the map
      if (!missile.checkEndMap(this.map.size)) {
        return false;
      }

      const hitToTank = this.userIds.some((otherUser) => {
        //if missiles this user's, then skip this iterations
        //TODO: how will interaction with teammates?
        if (otherUser === missile.userId) {
          return false;
        }

        return this.tanks[otherUser].missilesHitToTank(missile);
      });

      if (hitToTank) {
        return false;
      }

      const hitToLandscape = this.map.checkMissileDestroyLandscape(missile);
      //we used inverted value, because if hit was been, then need return false, for deleting missile
      return !hitToLandscape;
    });

    // this.showInConsole();

    const tanksData = Object.values(this.tanks).map(({ x, y, currentArmor, direction }) => ({
      x,
      y,
      currentArmor,
      direction,
    }));

    Object.values(this.tanks).forEach(({ ws }) => {
      ws.send(
        JSON.stringify({
          event: ACTIONS_TO_CLIENT.SET_GAME_DATA,
          data: {
            payload: {
              missiles: this.missiles,
              tanks: tanksData,
            },
          },
        }),
      );
    });
  }

  checkEndGame() {
    const lifeTanks = new Set();

    Object.values(this.tanks).forEach((tank) => {
      if (tank.currentArmor > 0) {
        lifeTanks.add(tank.teamId);
      }
    });

    if (lifeTanks.size === 1) {
      console.log('End Game');
      console.log(`Team ${lifeTanks.values().next().value} win`);

      this.endGame();
    }
  }

  startGame() {
    this.gameState.start();
    this.gameStarted = true;
  }

  endGame() {
    this.gameState.clear();
    Object.keys(this.tanks).forEach((userId) => {
      this.tanks[+userId].ws.gameId = null;
    });
  }

  pauseOnOff() {
    if (this.gameState.paused) {
      return this.gameState.resume();
    }

    this.gameState.pause();
  }
}
