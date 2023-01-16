import { Injectable } from '@nestjs/common';
type AllGamesValueType = { gameId: number; started: boolean; userIds: number[] };

@Injectable()
export class WsGamesState {
  //userId which connected at this node instance
  private userId: { [key: number]: number } = {};

  //add gameId, when user(which belongs this node instances) did join to gameId(any node instances)
  private gameId: { [key: number]: { userIds: number[]; gameId: number } } = {};

  //key = gameId
  //all games on all nodes
  private allGames: { [key: number]: AllGamesValueType } = {};

  addUserId(userId: number) {
    this.userId[userId] = userId;
  }

  addGameId(params: { userId: number; gameId: number }) {
    const { gameId, userId } = params;
    if (this.gameId[gameId]) {
      const userIds = [...this.gameId[gameId].userIds, userId];
      this.gameId[gameId] = { gameId, userIds };
      return;
    }

    this.gameId[gameId] = { gameId, userIds: [userId] };
  }

  getNotStartedGames() {
    return Object.values(this.allGames).filter((game) => !game.started);
  }

  getGameById(gameId: number) {
    return this.allGames[gameId];
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
    this.allGames[gameId] = gameData;
  }

  joinUserToGame(params: { userId: number; gameId: number }) {
    const { gameId, userId } = params;
    if (this.userId[userId]) {
      this.addGameId({ gameId, userId });
    }

    this.allGames[gameId].userIds.push(userId);
  }

  deleteUserId(userId: number) {
    delete this.userId[userId];
  }

  deleteUserFromGame(params: { userId: number; gameId: number }) {
    const game = this.allGames[params.gameId];

    if (!game) {
      return;
    }

    game.userIds = game.userIds.filter((userId) => userId !== params.userId);

    this.deleteUserIdAtGameId(params);
  }

  deleteUserIdAtGameId(params: { userId: number; gameId: number }) {
    const existUsersThisGameThisNode = this.gameId[params.gameId].userIds.filter(
      (userId) => userId !== params.userId,
    );

    //if users not left, then delete gameId
    if (!existUsersThisGameThisNode) {
      this.deleteGameId(params.gameId);
      return;
    }

    this.gameId[params.gameId].userIds = existUsersThisGameThisNode;
  }

  protected deleteGameId(gameId: number) {
    delete this.gameId[gameId];
  }

  deleteGame(gameId: number) {
    delete this.gameId[gameId];
    delete this.allGames[gameId];
  }

  changeGameStatus(gameId: number, status = true) {
    this.allGames[gameId].started = status;
  }

  getNewGameId() {
    const gameIds = Object.values(this.allGames).map(({ gameId }) => gameId);
    return gameIds.length ? Math.max(...gameIds) + 1 : 1;
  }
}
