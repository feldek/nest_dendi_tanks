import { defaultWeapon } from './../../constants/game.constants';

export interface IWeaponClass {
  damage?: number;
  speed?: number;
  rateOfFire?: number;
}

export class WeaponClass {
  public damage: number;
  public speed: number;
  public rateOfFire: number;

  constructor(params?: IWeaponClass) {
    this.damage = params?.damage ?? defaultWeapon.damage;
    this.speed = params?.speed ?? defaultWeapon.speed;
    this.rateOfFire = params?.rateOfFire ?? defaultWeapon.rateOfFire;
  }
}
