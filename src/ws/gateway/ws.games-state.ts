import { Injectable } from '@nestjs/common';

type AllGamesValueType = { gameId: number; started: boolean; userIds: number[] };

@Injectable()
export class WsGamesState {
  //userId which connected at this node instance
  private userId: { [key: number]: number } = {};

  //add gameId, when user(which belongs this node instances) did join to gameId(any node instances)
  private gameId: { [key: number]: { userIds: number[] } } = {};

  //key = gameId
  //all games on all nodes
  private stateAllGames: { [key: number]: AllGamesValueType } = {};

  addUserId(userId: number) {
    this.userId[userId] = userId;
  }

  addGameId(params: { userId: number; gameId: number }) {
    const { gameId, userId } = params;
    if (this.gameId[gameId]) {
      const userIds = [...this.gameId[gameId].userIds, userId];
      this.gameId[gameId] = { userIds };
      return;
    }

    this.gameId[gameId] = { userIds: [userId] };
  }

  getNotStartedGames() {
    return Object.values(this.stateAllGames).filter((game) => !game.started);
  }

  getStateGameById(gameId: number) {
    return this.stateAllGames[gameId];
  }

  addNewGame(gameData: AllGamesValueType) {
    const {
      gameId,
      userIds: [userId],
    } = gameData;
    if (this.userId[userId]) {
      this.addGameId({ gameId, userId });
      this.addUserId(userId);
    }
    this.stateAllGames[gameId] = gameData;
  }

  joinUserToGame(params: { userId: number; gameId: number }) {
    const { gameId, userId } = params;
    if (this.userId[userId]) {
      this.addGameId({ gameId, userId });
    }

    this.stateAllGames[gameId].userIds.push(userId);
  }

  deleteUserId(userId: number) {
    delete this.userId[userId];
  }

  leaveFromGame(params: { userId: number; gameId: number }) {
    this.deleteStateAllGames(params);
    this.deleteGameId(params);
  }

  private deleteStateAllGames(params: { userId: number; gameId: number }) {
    const game = this.stateAllGames[params.gameId];

    if (!game) {
      console.log(`pid = ${process.pid} : stateAllGames.${params.gameId} doesn\'t exist`);
      return;
    }

    game.userIds = game.userIds.filter((userId) => userId !== params.userId);

    if (!game.userIds.length) {
      delete this.stateAllGames[params.gameId];
    }
  }

  deleteGameId(params: { userId: number; gameId: number }) {
    const { gameId, userId } = params;
    const existUsersThisGameThisNode = this.gameId[gameId].userIds.filter(
      (existedUserId) => existedUserId !== userId,
    );

    //if users not left, then delete gameId
    if (!existUsersThisGameThisNode.length) {
      delete this.gameId[params.gameId];
      return;
    }

    this.gameId[params.gameId].userIds = existUsersThisGameThisNode;
  }

  endGame(gameId: number) {
    delete this.gameId[gameId];
    delete this.stateAllGames[gameId];
  }

  changeGameStatus(gameId: number, status = true) {
    this.stateAllGames[gameId].started = status;
  }

  getNewGameId() {
    const gameIds = Object.values(this.stateAllGames).map(({ gameId }) => gameId);
    return gameIds.length ? Math.max(...gameIds) + 1 : 1;
  }
}
