import { DynamicObjClass, IDynamicObj } from './dynamicObj.class';

export class MissilesClass extends DynamicObjClass {
  constructor(missiles: IDynamicObj) {
    const { x, y, speed, direction } = missiles;
    super({ x, y, speed, direction });
  }
}
