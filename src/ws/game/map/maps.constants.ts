import { MapClass } from './map.class';

export const maps = {
  testMap: new MapClass({
    size: { x: 300, y: 300 },
    blocks: [
      { x: 100, y: 10, currentDurability: 4 },
      { x: 100, y: 30, currentDurability: 4 },
      // { x: 100, y: 50, currentDurability: 4 },
      // { x: 100, y: 70, currentDurability: 4 },
      // { x: 100, y: 90, currentDurability: 4 },
      // { x: 100, y: 110, currentDurability: 4 },
      // { x: 210, y: 250, currentDurability: 4 },
      // { x: 230, y: 250, currentDurability: 4 },
      // { x: 250, y: 250, currentDurability: 4 },
      // { x: 270, y: 250, currentDurability: 4 },
      // { x: 290, y: 250, currentDurability: 4 },
    ],
  }),
};
