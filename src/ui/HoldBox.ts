import { t } from "i18next";
import { GUI_LABEL_HOLDBOX_STYLE } from "../fonts";
import { GameScene } from "../scenes/game-scene";
import { SHAPE_TO_BLOCKSKIN_FRAME, SHAPES } from "../shapes";
import { GetGroupBounds } from "../utilities/Utilities";
import { Game } from "phaser";

export type HoldBoxConfig = {
  borderThickness?: number;
  size?: number;
  fillColor?: number;
  borderColor?: number;
};

/*
 * This component represents the Hold Box in Gridfall.
 */
export class HoldBox extends Phaser.GameObjects.Container {
  private _graphics: Phaser.GameObjects.Graphics;
  private _text: Phaser.GameObjects.Text;
  private _borderThickness: number;
  private _holdGroup!: Phaser.GameObjects.Group;
  private _gameScene: GameScene;
  private _config: HoldBoxConfig;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config?: HoldBoxConfig
  ) {
    super(scene, x, y);
    this._config = config || {};
    this._gameScene = scene as GameScene;
    this._borderThickness = config?.borderThickness ?? 5;
    this._graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    this._graphics.fillStyle(config?.borderColor ?? 0xffffff, 1);
    this._graphics.fillRect(0, 0, config?.size ?? 120, config?.size ?? 120);
    this._graphics.fillStyle(config?.fillColor ?? 0x000000, 1);
    this._graphics.fillRect(
      this._borderThickness,
      this._borderThickness,
      (config?.size ?? 120) - 2 * this._borderThickness,
      (config?.size ?? 120) - 2 * this._borderThickness
    );
    this.add(this._graphics);
    this._holdGroup = scene.make.group({});
    this.add(this._holdGroup.getChildren());

    // Create text "Hold"
    this._text = scene.make
      .text({
        x,
        y: y - 24,
        text: t("labels.holdBox"),
        style: GUI_LABEL_HOLDBOX_STYLE,
      })
      .setOrigin(0, 0);
    this.add(this._text);

    // Add this container to the scene
    scene.add.existing(this);
  }

  public renderHold(): void {
    this._holdGroup!.clear(true, true);

    if (!this._gameScene.HoldType) return;

    const shape = SHAPES[this._gameScene.HoldType][0];

    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const block = this._gameScene.add
            .sprite(
              x * (GameScene.BLOCKSIZE / 2),
              y * (GameScene.BLOCKSIZE / 2),
              this._gameScene.BlockSkin,
              SHAPE_TO_BLOCKSKIN_FRAME[this._gameScene.HoldType!]
            )
            .setDisplaySize(GameScene.BLOCKSIZE / 2, GameScene.BLOCKSIZE / 2)
            .setOrigin(0);

          this._holdGroup.add(block);
        }
      });
    });

    // Use bounding box of the hold group to center it in the hold box
    const bounds = GetGroupBounds(this._holdGroup);
    let yOffset = bounds.height / 2;
    let xOffset = bounds.width / 2;
    console.log("Bounds: ", bounds);
    console.log("yOffset: ", yOffset);

    this.add([...this._holdGroup.getChildren()]);
    this._holdGroup.children.iterate((child) => {
      const sprite = child as Phaser.GameObjects.Sprite;
      sprite.x = sprite.x + (this._config.size ?? 120) / 2 - xOffset;
      sprite.y = sprite.y + (this._config.size ?? 120) / 2 - 20;
      //   sprite.x += this._graphics.x + (this._config.size ?? 120) / 2;
      //   sprite.y += this._graphics.y + (this._config.size ?? 120) / 2;
      return true;
    });
  }

  public get Graphics(): Phaser.GameObjects.Graphics {
    return this._graphics;
  }

  public get BorderThickness(): number {
    return this._borderThickness;
  }

  public get HoldGroup(): Phaser.GameObjects.Group {
    return this._holdGroup;
  }
}
