import { RADIUS } from 'src/constants/game.constants';
import { MissilesClass } from '../missiles/missiles.class';

export interface IMapClass {
  size?: {
    x: number;
    y: number;
  };
  blocks: { x: number; y: number; currentDurability: number }[];
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
          (x1 > x2 && x2 + 2 * RADIUS.BLOCK > x1) || (x2 > x1 && x1 + 2 * RADIUS.BLOCK > x2);

        const conditionYError =
          (y1 > y2 && y2 + 2 * RADIUS.BLOCK > y1) || (y2 > y1 && y1 + 2 * RADIUS.BLOCK > y2);

        if (conditionXError) {
          throw new Error(`Intersection between x ${x1} and ${x2} r=(${RADIUS.BLOCK})`);
        } else if (conditionYError) {
          throw new Error(`Intersection between y ${y1} and ${y2} r=(${RADIUS.BLOCK})`);
        }
      }
    });
  }

  //check and remove landscape, if missile hit
  checkMissileDestroyLandscape(missile: MissilesClass) {
    const findIndexHit = this.blocks.findIndex(({ x, y }) => {
      const hitToLandscapeCondition =
        x + RADIUS.MISSILES_BLOCK >= missile.x &&
        x - RADIUS.MISSILES_BLOCK <= missile.x &&
        y + RADIUS.MISSILES_BLOCK >= missile.y &&
        y - RADIUS.MISSILES_BLOCK <= missile.y;

      return hitToLandscapeCondition;
    });

    if (findIndexHit !== -1) {
      const currentDurability = this.blocks[findIndexHit].currentDurability - missile.damage;
      this.blocks[findIndexHit] = {
        ...this.blocks[findIndexHit],
        currentDurability,
      };
      if (currentDurability <= 0) {
        this.blocks.splice(findIndexHit, 1);
      }
      return true;
    }

    return false;
  }
}
