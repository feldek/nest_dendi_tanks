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
    this.damage = params?.damage ?? 1;
    this.speed = params?.speed ?? 90;
    this.rateOfFire = params?.rateOfFire ?? 1200;
  }
}
