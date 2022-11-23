import { DynamicObjClass, IDynamicObj } from './dynamicObj.class';

interface IMissilesClass extends IDynamicObj {
  damage: number;
  userId: number;
  teamId: string;
}
export class MissilesClass extends DynamicObjClass {
  userId: number;
  teamId: string;
  damage: number;

  constructor(missiles: IMissilesClass) {
    const { userId, damage, teamId, ...otherParams } = missiles;
    super(otherParams);
    this.userId = missiles.userId;
    this.damage = missiles.damage;
    this.teamId = missiles.teamId;
  }

  //return false, if missiles move out from map
  checkEndMap(size: { x: number; y: number }) {
    if (this.direction === 'bottom' || this.direction === 'top') {
      return size.y >= this.y && this.y > 0;
    }
    return size.x >= this.x && this.x > 0;
  }
}
