import { GameClass } from './game.class';
import { MapClass } from './map/map.class';
import { ITankClass, TankClass } from './tank/tank.class';

export type TGameId = number;
export class GameSessionsClass {
  [key: TGameId]: GameClass;

  constructor() {}

  createGameSession(sessions: { tanks: ITankClass[]; map: MapClass }) {
    const { tanks, map } = sessions;
    const gameId = this.getNewSessionId();
    this[gameId] = new GameClass(tanks, map);
    return gameId;
  }

  joinToGame(gameId: number, tank: ITankClass) {
    this[gameId].tanks[tank.userId] = new TankClass(
      tank,
      this[gameId].checkEndGame.bind(this[gameId]),
    );
  }

  private getNewSessionId() {
    const sessionIds = Object.keys(this).map(Number);
    return sessionIds.length === 0 ? 1 : Math.max(...sessionIds) + 1;
  }

  removeSessionById(gameId: number) {
    delete this[gameId];
  }
}

export const gameSessions = new GameSessionsClass();
