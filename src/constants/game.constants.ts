import { tankActionType } from 'src/game/tank/tank.class';
import { WeaponClass } from 'src/game/tank/weapon.class';

export const enum RADIUS {
  TANK = 10,

  //i mean map block(landscape)
  BLOCK = 10,
  MISSILES = 3,
  MISSILES_BLOCK = RADIUS.BLOCK + RADIUS.MISSILES,
  MISSILES_TANK = RADIUS.TANK + RADIUS.MISSILES,
  LANDSCAPE_TANK = RADIUS.TANK + RADIUS.BLOCK,
}
export const defaultWeapon = {
  damage: 1,
  speed: 90,
  rateOfFire: 1000,
};

export const defaultTank = {
  state: 'stay' as tankActionType,
  armor: 4,
  weapon: new WeaponClass(),
};

