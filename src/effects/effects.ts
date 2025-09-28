import Phaser from "phaser";
import { ACCENT_COLOR } from "../colors";

// Collection of some scene effects

const MAX_ARGENTINO_COLOR = "#00FFFF";

export function addSceneBackground(scene: Phaser.Scene): void {
  const bgGraphics = scene.add.graphics();
  bgGraphics.fillStyle(ACCENT_COLOR, 1);
  bgGraphics.fillRect(0, 0, scene.scale.width, scene.scale.height);
}

/***
 * Adds an animated grid background to the scene.
 * The grid consists of rectangles that fade in and out with a sine wave effect.
 */
export function addAnimatedGridBackground(
  scene: Phaser.Scene,
  cols: number = 20,
  rows: number = 20,
  color: Phaser.Display.Color = Phaser.Display.Color.HexStringToColor(
    MAX_ARGENTINO_COLOR
  )
) {
  const blockSize = 32;
  const offsetX = (scene.scale.width - cols * blockSize) / 2;
  const offsetY = (scene.scale.height - rows * blockSize) / 2;
  const startAlpha = 0.2;
  const endAlpha = 1;
  //const color = Phaser.Display.Color.GetColor(150, 5, 143);
  const convertedColor = color;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const block = scene.add
        .rectangle(
          offsetX + x * blockSize,
          offsetY + y * blockSize,
          blockSize - 2,
          blockSize - 2,
          convertedColor.color
        )
        .setOrigin(0)
        .setAlpha(startAlpha);

      scene.tweens.add({
        targets: block,
        alpha: { from: startAlpha, to: Phaser.Math.Between(0, 100) / 100 },
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1000),
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut",
      });
    }
  }
}

export type ScanlinesOptions = {
  key?: string;
  alpha?: number;
  blendMode?: number;
  speedY?: number;
  depth?: number;
};

export type ScanlinesHandle = {
  sprite: Phaser.GameObjects.TileSprite;
  setSpeedY: (v: number) => void;
  setVisible: (v: boolean) => void;
  setAlpha: (v: number) => void;
  destroy: () => void;
};

/**
 * Adds a scanline overlay to the scene.
 * Requires a small pattern texture (e.g. 1×2 PNG) under the key 'scanlines'.
 */
export const addScanlines = (
  scene: Phaser.Scene,
  opts: ScanlinesOptions = {}
): ScanlinesHandle => {
  const key = opts.key ?? "scanlines";

  if (!scene.textures.exists(key)) {
    console.warn(
      `[addScanlines] Texture "${key}" not found. Did you this.load.image('${key}', 'assets/gfx/scanlines.png') in preload()?`
    );
  }

  const width = scene.scale.width;
  const height = scene.scale.height;

  const sprite = scene.add
    .tileSprite(0, 0, width, height, key)
    .setOrigin(0)
    .setScrollFactor(0)
    .setAlpha(opts.alpha ?? 0.15)
    .setBlendMode(opts.blendMode ?? Phaser.BlendModes.NORMAL)
    .setDepth(opts.depth ?? 10_000)
    .setScale(4);

  let speedY = opts.speedY ?? 0;

  const onUpdate = (_time: number, delta: number) => {
    if (speedY !== 0) {
      sprite.tilePositionY += (speedY * delta) / 1000; // px/s
    }
  };

  const onResize = () => {
    sprite.setSize(scene.scale.width, scene.scale.height);
  };

  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);

  const destroy = () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    scene.scale.off(Phaser.Scale.Events.RESIZE, onResize);
    sprite.destroy();
  };

  return {
    sprite,
    setSpeedY: (v: number) => {
      speedY = v;
    },
    setVisible: (v: boolean) => {
      sprite.setVisible(v);
    },
    setAlpha: (v: number) => {
      sprite.setAlpha(v);
    },
    destroy,
  };
};
