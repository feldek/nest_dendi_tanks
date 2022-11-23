import { MISSILES_LANDSCAPE_RADIUS } from './game.class';
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

  missilesHitToTank(missile: { x: number; y: number; teamId: string; damage: number }) {
    const hitToTankCondition =
      this.tank.x + MISSILES_LANDSCAPE_RADIUS >= missile.x &&
      this.tank.x - MISSILES_LANDSCAPE_RADIUS <= missile.x &&
      this.tank.y + MISSILES_LANDSCAPE_RADIUS >= missile.y &&
      this.tank.y - MISSILES_LANDSCAPE_RADIUS <= missile.y;

    //hit missiles to tank
    if (hitToTankCondition && this.teamId !== missile.teamId) {
      this.tank.currentArmor -= missile.damage;
      return true;
    }

    return false;
  }
}
