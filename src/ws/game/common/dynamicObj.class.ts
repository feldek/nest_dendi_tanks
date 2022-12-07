import { DELTA_T } from '../../../constants/index';
export type directionType = 'right' | 'left' | 'up' | 'down';
export interface ICoordinate {
  x: number;
  y: number;
}

export interface IDynamicObj extends ICoordinate {
  direction: directionType;
  speed: number;
}

type MoveType = () => void;

export class DynamicObjClass implements IDynamicObj {
  public x: number;
  public y: number;
  public speed: number;
  public direction: directionType;

  public move: {
    right: MoveType;
    left: MoveType;
    up: MoveType;
    down: MoveType;
    calculate: MoveType;
  };

  constructor(missile: IDynamicObj) {
    this.x = missile.x;
    this.y = missile.y;
    this.speed = missile.speed;
    this.direction = missile.direction;

    this.move = {
      right: () => {
        this.x += this.speed * DELTA_T;
      },
      left: () => {
        this.x -= this.speed * DELTA_T;
      },
      up: () => {
        this.y += this.speed * DELTA_T;
      },
      down: () => {
        this.y -= this.speed * DELTA_T;
      },
      calculate: () => {
        this.move[this.direction]();
      },
    };
  }
}
