import { IntervalTimer } from './common/interval.class';
import { ITankClass, TankClass } from './tank/tank.class';
import { DELTA_T } from '../constants';
import { MissilesClass } from './missiles/missiles.class';
import { MapClass } from './map/map.class';
import { ACTIONS } from 'src/interfaces/ws';
import { IClientAction } from 'src/ws/actions/client';
import { WsController } from '../ws/ws.controller';
import { IServerAction } from 'src/ws/actions/server';

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
  propagateClientEvent: InstanceType<typeof WsController>['propagateClientEvent'] | null = null;
  propagateServerEvent: InstanceType<typeof WsController>['propagateServerEvent'] | null = null;

  constructor(tanks: ITankClass[], map: MapClass, readonly gameId: number) {
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
      //we used inverted value, because if hit was been, it need return false, for deleting missile
      return !hitToLandscape;
    });

    this.propagateClientEvent<IClientAction[ACTIONS.GAME_SNAPSHOT]>(ACTIONS.GAME_SNAPSHOT, {
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
      //TODO: landscape blocks necessary send only changes(delta from previous blocks)
      blocks: this.map.blocks,
    };
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

      this.propagateClientEvent<IClientAction[ACTIONS.END_GAME]>(ACTIONS.END_GAME, {
        to: { gameId: this.gameId },
        payload: {
          message: `Team ${teamWin} win`,
          teamWin,
        },
      });

      this.propagateServerEvent<IServerAction[ACTIONS.END_GAME]>(ACTIONS.END_GAME, {
        to: { gameId: this.gameId },
      });
    }
  }

  startGame(
    propagateClientEvent: typeof this.propagateClientEvent,
    propagateServerEvent: typeof this.propagateServerEvent,
  ) {
    this.propagateClientEvent = propagateClientEvent;
    this.propagateServerEvent = propagateServerEvent;
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
