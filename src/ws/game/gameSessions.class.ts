import { GameClass } from './game.class';
import { MapClass } from './map/map.class';
import { ITankClass, TankClass } from './tank/tank.class';

export class GameSessionsClass {
  [key: number]: GameClass;

  constructor() {}

  createGameSession(sessions: { tanks: ITankClass[]; map: MapClass }) {
    const { tanks, map } = sessions;
    const sessionId = this.getNewSessionId();
    this[sessionId] = new GameClass(tanks, map);
    return sessionId;
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
