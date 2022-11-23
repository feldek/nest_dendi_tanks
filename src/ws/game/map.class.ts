import { MISSILES_LANDSCAPE_RADIUS, LANDSCAPE_RADIUS } from './game.class';

export interface IMapClass {
  size?: {
    x: number;
    y: number;
  };
  blocks: { x: number; y: number; durability?: number }[];
}
export class MapClass implements IMapClass {
  public size: IMapClass['size'];
  public blocks: IMapClass['blocks'];

  constructor(params: IMapClass) {
    this.size = {
      x: params?.size?.x ?? 300,
      y: params?.size?.y ?? 300,
    };

    this.checkBlockIntersections(params.blocks);
    this.blocks = params.blocks;
  }

  //check intersection blocks
  checkBlockIntersections(blocks: IMapClass['blocks']) {
    blocks.forEach(({ x: x1, y: y1 }, ind1) => {
      for (let i = ind1; i < blocks.length; i++) {
        if (ind1 === i) {
          continue;
        }
        const { x: x2, y: y2 } = blocks[i];

        const conditionXError =
          (x1 > x2 && x2 + 2 * LANDSCAPE_RADIUS > x1) ||
          (x2 > x1 && x1 + 2 * LANDSCAPE_RADIUS > x2);

        const conditionYError =
          (y1 > y2 && y2 + 2 * LANDSCAPE_RADIUS > y1) ||
          (y2 > y1 && y1 + 2 * LANDSCAPE_RADIUS > y2);

        if (conditionXError) {
          throw new Error(`Intersection between x ${x1} and ${x2} r=(${LANDSCAPE_RADIUS})`);
        } else if (conditionYError) {
          throw new Error(`Intersection between y ${y1} and ${y2} r=(${LANDSCAPE_RADIUS})`);
        }
      }
    });
  }

  //check and remove landscape, if missile hit
  checkMissileHitToLandscape(missile: { x: number; y: number }) {
    const findIndexHit = this.blocks.findIndex(({ x, y }) => {
      const hitToLandscapeCondition =
        x + MISSILES_LANDSCAPE_RADIUS >= missile.x &&
        x - MISSILES_LANDSCAPE_RADIUS <= missile.x &&
        y + MISSILES_LANDSCAPE_RADIUS >= missile.y &&
        y - MISSILES_LANDSCAPE_RADIUS <= missile.y;

      return hitToLandscapeCondition;
    });

    if (findIndexHit !== -1) {
      this.blocks.splice(findIndexHit, 1);
      return true;
    }

    return false;
  }
}
