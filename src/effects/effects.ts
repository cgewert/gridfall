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
