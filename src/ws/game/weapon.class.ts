export interface IWeaponClass {
  damage?: number;
  speed?: number;
}

export class WeaponClass {
  public damage: number;
  public speed: number;

  constructor(params?: IWeaponClass) {
    this.damage = params?.damage ?? 1;
    this.speed = params?.speed ?? 90;
  }
}
