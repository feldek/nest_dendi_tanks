import { RequireAtLeastOne } from 'src/interfaces/common';
import { UserClass } from './user.class';

interface IMap {
  size: {
    x: number;
    y: number;
  };
}
class GameClass {
  private map: IMap;
  private userIds: number[];
  private users: { [key: number]: UserClass };
  private NCycles = 0;
  private dt = 0.1;
  private move: {
    right: (user: UserClass) => void;
    left: (user: UserClass) => void;
    top: (user: UserClass) => void;
    bottom: (user: UserClass) => void;
    calculate: (user: UserClass) => void;
  };

  constructor(users: { [key: number]: UserClass }, map: IMap) {
    const userIds = Object.keys(users).map(Number);
    userIds.forEach((key) => {
      users[key].userId = key;
    });
    this.userIds = userIds;
    this.users = users as { [key: number]: UserClass };
    this.map = map;
    this.move = {
      right: (user: UserClass) => {
        user.y += user.tank.speed * this.dt * this.NCycles;
      },
      left: (user: UserClass) => {
        user.y -= user.tank.speed * this.dt * this.NCycles;
      },
      top: (user: UserClass) => {
        user.x += user.tank.speed * this.dt * this.NCycles;
      },
      bottom: (user: UserClass) => {
        user.x -= user.tank.speed * this.dt * this.NCycles;
      },
      calculate: (user: UserClass) => {
        this.move[user.direction](user);
      },
    };
  }

  changeMovement(
    userId: number,
    params: RequireAtLeastOne<Pick<UserClass, 'direction' | 'state'>, 'direction' | 'state'>,
  ) {
    if (params.direction) {
      this.users[userId].direction = params.direction;
    }

    if (params.state) {
      this.users[userId].state = params.state;
    }
  }

  launch() {
    setInterval(() => {
      this.NCycles += 1;
      this.userIds.map((userId) => {
        const user = this.users[userId];
        if (user.state === 'move') {
          this.move.calculate(user);
        }
        console.log(`userId:${userId}`, user.x, user.y);
      });
    }, this.dt * 1000);
  }
}
