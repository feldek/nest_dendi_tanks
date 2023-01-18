import { Injectable } from '@nestjs/common';
import { GameClass } from './game.class';
import { MapClass } from './map/map.class';
import { ITankClass, TankClass } from './tank/tank.class';

export type TGameId = number;

@Injectable()
export class GameSessionsClass {
  //TODO: temporary solution, in future move to db
  //save info about all gameIds on other node instances too
  [key: TGameId]: GameClass;

  createNewGame(sessions: { tanks: ITankClass[]; map: MapClass }, gameId: number) {
    const { tanks, map } = sessions;
    this[gameId] = new GameClass(tanks, map, gameId);
    return gameId;
  }

  joinToGame(gameId: number, tank: ITankClass) {
    this[gameId].tanks[tank.userId] = new TankClass(
      tank,
      this[gameId].checkEndGame.bind(this[gameId]),
    );

    this[gameId].addTank(tank.userId);
  }

  removeGameById(currentGameId: number) {
    if (this[currentGameId]) {
      delete this[currentGameId];
    }
  }
}
