import { TankClass } from './tank.class';

export type userAction = 'stay' | 'move' | 'hold';
export type directionGaze = 'right' | 'left' | 'top' | 'bottom';

export interface IUserClass {
  x?: number;
  y?: number;
  direction?: directionGaze;
  state?: userAction;
  userId?: number;
  teamId: string;
}

export class UserClass {
  public x: number;
  public y: number;
  public direction: directionGaze;
  public state: userAction;
  public userId?: number;
  public teamId: string;
  public tank: TankClass;

  constructor(user: IUserClass, tank?: TankClass) {
    this.x = user.x ?? 0;
    this.y = user.y ?? 0;
    this.direction = user.direction ?? 'top';
    this.state = user.state ?? 'stay';
    this.userId = user?.userId;
    this.teamId = user.teamId;
    this.tank = tank ?? new TankClass();
  }
}
