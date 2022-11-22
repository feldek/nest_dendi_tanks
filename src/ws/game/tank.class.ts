import { RequireAtLeastOne } from 'src/interfaces/common';
import { DynamicObjClass, IDynamicObj } from './dynamicObj.class';
import { WeaponClass } from './weapon.class';

export type tankActionType = 'stay' | 'move' | 'hold';

interface ITankClass extends IDynamicObj {
  state?: tankActionType;
  armor?: number;
}

export class TankClass extends DynamicObjClass {
  public state: tankActionType;
  public armor: number;
  public weapon: WeaponClass;

  constructor(tank: ITankClass, weapon?: WeaponClass) {
    const { x, y, speed, direction } = tank;

    super({ x, y, speed, direction });
    this.state = tank.state ?? 'stay';
    this.armor = tank?.armor ?? 4;
    this.weapon = weapon ?? new WeaponClass();
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
