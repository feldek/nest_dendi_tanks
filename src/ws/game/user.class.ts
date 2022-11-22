import { TankClass } from './tank.class';

export interface IUserClass {
  userId?: number;
  teamId: string;
}

export class UserClass {
  public userId?: number;
  public teamId: string;
  public tank: TankClass;

  constructor(user: IUserClass, tank?: TankClass) {
    this.userId = user?.userId;
    this.teamId = user.teamId;
    this.tank = tank ?? new TankClass({ x: 20, y: 20, speed: 30, direction: 'top' });
  }
}
