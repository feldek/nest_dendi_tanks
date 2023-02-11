import { DELTA_T } from '../../constants';
import { RequireAtLeastOne } from 'src/interfaces/common';
import { DynamicObjClass, IDynamicObj } from '../common/dynamicObj.class';
import { WeaponClass } from './weapon.class';
import { RADIUS, defaultTank } from 'src/constants/game.constants';
import { MissilesClass } from '../missiles/missiles.class';

export type tankActionType = 'stay' | 'move' | 'hold';
export type TTankControl = RequireAtLeastOne<
  Pick<TankClass, 'direction' | 'state'>,
  'direction' | 'state'
>;

export interface ITankClass extends IDynamicObj {
  userId: number;
  teamId: string;
  state?: tankActionType;
  armor?: number;
  currentArmor?: number;
}

export class TankClass extends DynamicObjClass {
  public userId?: number;
  public teamId: string;
  public state: tankActionType;
  public armor: number;
  public currentArmor: number;
  public weapon: WeaponClass;
  public shotPossibility: boolean = true;

  constructor(tank: ITankClass, callbackCheckEndGame: () => void, weapon?: WeaponClass) {
    const { x, y, speed, direction } = tank;

    const { armor, state } = defaultTank;
    super({ x, y, speed, direction });
    this.state = tank.state ?? state;
    this.armor = tank?.armor ?? armor;
    this.currentArmor = tank.armor ?? armor;
    this.weapon = weapon ?? defaultTank.weapon;
    this.userId = tank?.userId;
    this.teamId = tank.teamId;

    //each times when some tank currentArmor set <0, check if the game is over
    return new Proxy(this, {
      set(target, name, value) {
        if (name in target) {
          if (name === 'currentArmor' && value <= 0) {
            callbackCheckEndGame();
          }
          target[name] = value;
          return true;
        }
        return false;
      },
    });
  }

  //calculate new coordinates with
  calculateCoordinates(size: { x: number; y: number }) {
    const stopCondition =
      (this.direction === 'down' && this.y - this.speed * DELTA_T <= 0) ||
      (this.direction === 'up' && this.y + this.speed * DELTA_T >= size.y) ||
      (this.direction === 'left' && this.x - this.speed * DELTA_T <= 0) ||
      (this.direction === 'right' && this.x + this.speed * DELTA_T >= size.x);

    if (this.state === 'move' && !stopCondition) {
      this.move.calculate();
    }
  }

  intersectionLandscape(block: { x: number; y: number }) {
    let intersectionCondition = false;

    if (this.direction === 'down') {
      intersectionCondition =
        block.x + RADIUS.LANDSCAPE_TANK > this.x &&
        block.x - RADIUS.LANDSCAPE_TANK < this.x &&
        block.y + RADIUS.LANDSCAPE_TANK > this.y - this.speed * DELTA_T &&
        block.y - RADIUS.LANDSCAPE_TANK < this.y - this.speed * DELTA_T;
    } else if (this.direction === 'up') {
      intersectionCondition =
        block.x + RADIUS.LANDSCAPE_TANK > this.x &&
        block.x - RADIUS.LANDSCAPE_TANK < this.x &&
        block.y + RADIUS.LANDSCAPE_TANK > this.y + this.speed * DELTA_T &&
        block.y - RADIUS.LANDSCAPE_TANK < this.y + this.speed * DELTA_T;
    } else if (this.direction === 'right') {
      intersectionCondition =
        block.x + RADIUS.LANDSCAPE_TANK > this.x + this.speed * DELTA_T &&
        block.x - RADIUS.LANDSCAPE_TANK < this.x + this.speed * DELTA_T &&
        block.y + RADIUS.LANDSCAPE_TANK > this.y &&
        block.y - RADIUS.LANDSCAPE_TANK < this.y;
    } else if (this.direction === 'left') {
      intersectionCondition =
        block.x + RADIUS.LANDSCAPE_TANK > this.x - this.speed * DELTA_T &&
        block.x - RADIUS.LANDSCAPE_TANK < this.x - this.speed * DELTA_T &&
        block.y + RADIUS.LANDSCAPE_TANK > this.y &&
        block.y - RADIUS.LANDSCAPE_TANK < this.y;
    }

    return intersectionCondition;
  }

  changeMovement(params: TTankControl) {
    if (params.direction) {
      this.direction = params.direction;
    }

    if (params.state) {
      this.state = params.state;
    }
  }

  missilesHitToTank(missile: { x: number; y: number; teamId: string; damage: number }) {
    const hitToTankCondition =
      this.x + RADIUS.MISSILES_BLOCK >= missile.x &&
      this.x - RADIUS.MISSILES_BLOCK <= missile.x &&
      this.y + RADIUS.MISSILES_BLOCK >= missile.y &&
      this.y - RADIUS.MISSILES_BLOCK <= missile.y;

    //hit missiles to tank
    if (hitToTankCondition && this.teamId !== missile.teamId) {
      this.currentArmor -= missile.damage;
      return true;
    }

    return false;
  }

  shot(missiles: MissilesClass[]) {
    if (this.shotPossibility) {
      missiles.push(
        new MissilesClass({
          direction: this.direction,
          speed: this.weapon.speed,
          x: this.x,
          y: this.y,
          userId: this.userId,
          teamId: this.teamId,
          damage: this.weapon.damage,
        }),
      );

      this.shotPossibility = false;
      setTimeout(() => {
        this.shotPossibility = true;
      }, this.weapon.rateOfFire);
    }
  }
}
