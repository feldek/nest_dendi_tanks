import { WeaponClass } from './weapon.class';

interface ITankClass {
  speed?: number;
  armor?: number;
}

export class TankClass {
  public speed: number;
  public armor: number;
  public weapon: WeaponClass;
  public testBot: any;

  constructor(tank?: ITankClass, weapon?: WeaponClass) {
    this.speed = tank?.speed ?? 30;
    this.armor = tank?.armor ?? 4;
    this.weapon = weapon ?? new WeaponClass();
  }
}
