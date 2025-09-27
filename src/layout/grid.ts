export const DEFAULT_GRID_BG_COLOR = 0x000000;
export const DEFAULT_GRID_STROKE_COLOR = 0x000000;
export const DEFAULT_GRID_BG_OPACITY = 0.05;
export const DEFAULT_GRID_STROKE_OPACITY = 0.1;
export const DEFAULT_GRID_WIDTH = 10;
export const DEFAULT_GRID_HEIGHT = 20;

export const BLOCKSIZE = 40;

export type GridConfig = {
  width?: number;
  height?: number;
  bgColor?: number;
  strokeColor?: number;
  bgOpacity?: number;
  strokeOpacity?: number;
};

export const AddGrid = (scene: Phaser.Scene, config: GridConfig = {}) => {
  const blocksGroup = scene.add.group();

  const {
    width = DEFAULT_GRID_WIDTH,
    height = DEFAULT_GRID_HEIGHT,
    bgColor = DEFAULT_GRID_BG_COLOR,
    strokeColor = DEFAULT_GRID_STROKE_COLOR,
    bgOpacity = DEFAULT_GRID_BG_OPACITY,
    strokeOpacity = DEFAULT_GRID_STROKE_OPACITY,
  } = config;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const posX =
        x * BLOCKSIZE + scene.scale.width / 2 - (width * BLOCKSIZE) / 2;
      const posY =
        y * BLOCKSIZE + scene.scale.height / 2 - (height * BLOCKSIZE) / 2;

      const block = scene.add.rectangle(
        posX,
        posY,
        BLOCKSIZE,
        BLOCKSIZE,
        bgColor,
        bgOpacity
      );

      block.setOrigin(0);
      block.setStrokeStyle(1, strokeColor, strokeOpacity);
      blocksGroup.add(block);
    }
  }

  blocksGroup.setName("Grid");
  return blocksGroup;
};
