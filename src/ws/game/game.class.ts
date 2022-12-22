import { IntervalTimer } from './common/interval.class';
import { ITankClass, TankClass } from './tank/tank.class';
import { DELTA_T } from '../../constants';
import { MissilesClass } from './missiles/missiles.class';
import { MapClass } from './map/map.class';
import { CLIENT_ACTIONS, SERVER_ACTIONS } from 'src/interfaces/ws';
import { IClientAction } from '../gateway/actions/client-actions';
import { WsController } from '../ws.controller';
import { IServerAction } from '../gateway/actions/server-actions';

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
      //we used inverted value, because if hit was been, then need return false, for deleting missile
      return !hitToLandscape;
    });

    // this.showInConsole();

    const tanksData = Object.values(this.tanks).map((tank) => ({
      x: tank.x,
      y: tank.y,
      currentArmor: tank.currentArmor,
      direction: tank.direction,
      userId: tank.userId,
      teamId: tank.teamId,
    }));

    this.propagateClientEvent<IClientAction[CLIENT_ACTIONS.GAME_SNAPSHOT]>(
      CLIENT_ACTIONS.GAME_SNAPSHOT,
      {
        to: { gameId: this.gameId },
        payload: {
          tanks: tanksData,
          missiles: this.missiles,
        },
      },
    );
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

      this.propagateClientEvent<IClientAction[CLIENT_ACTIONS.END_GAME]>(CLIENT_ACTIONS.END_GAME, {
        to: { gameId: this.gameId },
        payload: {
          message: `Team ${teamWin} win`,
          teamWin,
        },
      });

      this.propagateServerEvent<IServerAction[SERVER_ACTIONS.END_GAME]>(SERVER_ACTIONS.END_GAME, {
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

  pauseOnOff() {
    if (this.gameState.paused) {
      return this.gameState.resume();
    }

    this.gameState.pause();
  }
}
