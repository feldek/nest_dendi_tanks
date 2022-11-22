import { DELTA_T } from '../../constants';
import { RequireAtLeastOne } from 'src/interfaces/common';
import { DynamicObjClass, IDynamicObj } from './dynamicObj.class';
import { WeaponClass } from './weapon.class';

export type tankActionType = 'stay' | 'move' | 'hold';

interface ITankClass extends IDynamicObj {
  state?: tankActionType;
  armor?: number;
  currentArmor?: number;
}

export class TankClass extends DynamicObjClass {
  public state: tankActionType;
  public armor: number;
  public currentArmor: number;
  public weapon: WeaponClass;

  constructor(tank: ITankClass, weapon?: WeaponClass) {
    const { x, y, speed, direction } = tank;

    super({ x, y, speed, direction });
    this.state = tank.state ?? 'stay';
    this.armor = tank?.armor ?? 4;
    this.currentArmor = tank.armor ?? 4;
    this.weapon = weapon ?? new WeaponClass();
  }

  calculateCoordinates(size: { x: number; y: number }) {
    if (this.state === 'move') {
      if (
        (this.direction === 'bottom' && this.y - this.speed * DELTA_T <= 0) ||
        (this.direction === 'top' && this.y + this.speed * DELTA_T >= size.y) ||
        (this.direction === 'left' && this.x - this.speed * DELTA_T <= 0) ||
        (this.direction === 'right' && this.x + this.speed * DELTA_T >= size.x)
      ) {
      } else {
        this.move.calculate();
      }
    }
  }

  changeMovement(
    params: RequireAtLeastOne<Pick<TankClass, 'direction' | 'state'>, 'direction' | 'state'>,
  ) {
    if (params.direction) {
      this.direction = params.direction;
    }

    if (params.state) {
      this.state = params.state;
    }
  }
}
