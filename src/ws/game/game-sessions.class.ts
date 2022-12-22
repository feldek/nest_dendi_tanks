import { GameClass } from './game.class';
import { MapClass } from './map/map.class';
import { ITankClass, TankClass } from './tank/tank.class';

export type TGameId = number;
export class GameSessionsClass {
  //TODO: temporary solution, in future move to db
  //save info about all gameIds on other node instances too
  allGames: { gameId: number; started: boolean; userIds: number[] }[] = [];
  [key: TGameId]: GameClass;

  createNewGame(sessions: { tanks: ITankClass[]; map: MapClass }) {
    const { tanks, map } = sessions;
    const gameId = this.getNewSessionId();
    // this.allGameIds.push(gameId);
    this[gameId] = new GameClass(tanks, map, gameId);
    return gameId;
  }

  joinToGame(gameId: number, tank: ITankClass) {
    this[gameId].tanks[tank.userId] = new TankClass(
      tank,
      this[gameId].checkEndGame.bind(this[gameId]),
    );

    this[gameId].userIds.push(tank.userId);
  }

  getAllNonStartedGames() {
    return this.allGames;
  }

  private getNewSessionId() {
    const gameIds = this.allGames.map(({ gameId }) => gameId);
    return gameIds.length ? Math.max(...gameIds) + 1 : 1;
  }

  removeSessionById(currentGameId: number) {
    if (this[currentGameId]) {
      delete this[currentGameId];
    }
  }
}
