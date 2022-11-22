import { DynamicObjClass, IDynamicObj } from './dynamicObj.class';

interface IMissilesClass extends IDynamicObj {
  userId: number;
}
export class MissilesClass extends DynamicObjClass {
  userId: number;

  constructor(missiles: IMissilesClass) {
    const { x, y, speed, direction } = missiles;
    super({ x, y, speed, direction });
    this.userId = missiles.userId;
  }

  calculateCoordinates(size: { x: number; y: number }) {
    this.move.calculate();

    if (this.direction === 'bottom' || this.direction === 'top') {
      return size.y >= this.y && this.y > 0;
    }
    return size.x >= this.x && this.x > 0;
  }
}
