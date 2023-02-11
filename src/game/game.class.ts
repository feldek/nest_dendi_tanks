import { IntervalTimer } from './common/interval.class';
import { ITankClass, TankClass } from './tank/tank.class';
import { DELTA_T } from '../constants';
import { MissilesClass } from './missiles/missiles.class';
import { IMapClass, MapClass } from './map/map.class';
import { EmitServer } from 'src/ws/actions/server/emitter';
import { EmitClient } from 'src/ws/actions/client/emitter';
import { ACTIONS } from 'src/constants/actions.constants';

//where key - userId
export type GameTanksConstructor = ITankClass[];
export type TGameTanks = { [key: number]: TankClass };

export class GameClass {
  private map: MapClass;
  //get sum info about hit to landscape
  private changeOfLandscapeState: IMapClass['blocks'] = [];
  private userIds: number[];
  private gameState: IntervalTimer;
  tanks: TGameTanks;
  missiles: MissilesClass[];
  gameStarted: boolean = false;

  constructor(
    tanks: ITankClass[],
    map: MapClass,
    readonly gameId: number,
    readonly emitClient: EmitClient,
    readonly emitServer: EmitServer,
  ) {
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

  getMap() {
    return this.map;
  }

  private calculateOneStep() {
    this.changeOfLandscapeState = [];
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

      if (hitToLandscape) {
        this.changeOfLandscapeState.push(hitToLandscape);
      }
      //we used inverted value, because if hit was been, it need return false, for deleting missile
      return !hitToLandscape;
    });

    this.emitClient[ACTIONS.GAME_SNAPSHOT]({
      to: { gameId: this.gameId },
      payload: this.getGameSnapshot(),
    });
  }

  //get positions and metadata of all objects on the map
  getGameSnapshot() {
    const tanksData = Object.values(this.tanks).map((tank) => ({
      x: tank.x,
      y: tank.y,
      currentArmor: tank.currentArmor,
      direction: tank.direction,
      userId: tank.userId,
      teamId: tank.teamId,
    }));

    return {
      tanks: tanksData,
      missiles: this.missiles,
      blocks: this.changeOfLandscapeState,
    };
  }

  addTank(userId: number) {
    this.userIds.push(userId);
  }

  checkEndGame() {
    const lifeTeams = new Set();

    Object.values(this.tanks).forEach((tank) => {
      if (tank.currentArmor > 0) {
        lifeTeams.add(tank.teamId);
      }
    });

    if (lifeTeams.size === 1) {
      const teamWin = lifeTeams.values().next().value;
      console.log('End Game');
      console.log(`Team ${teamWin} win`);

      this.endGame();

      this.emitClient[ACTIONS.END_GAME]({
        to: { gameId: this.gameId },
        payload: {
          message: `Team ${teamWin} win`,
          teamWin,
        },
      });

      this.emitServer[ACTIONS.END_GAME]({
        to: { gameId: this.gameId },
      });
    }
  }

  startGame() {
    this.gameState.start();
    this.gameStarted = true;
  }

  endGame() {
    this.gameState.clear();
  }

  pauseOnOff(pause: boolean) {
    if (this.gameState.paused && !pause) {
      this.gameState.resume();
      return true;
    } else if (!this.gameState.paused && pause) {
      this.gameState.pause();
      return true;
    }
  }
}
