import { t } from "i18next";
import { GUI_LABEL_HOLDBOX_STYLE } from "../fonts";
import { GameScene } from "../scenes/game-scene";
import { SHAPE_TO_BLOCKSKIN_FRAME, SHAPES } from "../shapes";

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
  private static readonly DEFAULT_SIZE = 120;
  private _graphics: Phaser.GameObjects.Graphics;
  private _label: Phaser.GameObjects.Text;
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
    this._graphics.fillRect(
      0,
      0,
      config?.size ?? HoldBox.DEFAULT_SIZE,
      config?.size ?? HoldBox.DEFAULT_SIZE
    );
    this._graphics.fillStyle(config?.fillColor ?? 0x000000, 1);
    this._graphics.fillRect(
      this._borderThickness,
      this._borderThickness,
      (config?.size ?? HoldBox.DEFAULT_SIZE) - 2 * this._borderThickness,
      (config?.size ?? HoldBox.DEFAULT_SIZE) - 2 * this._borderThickness
    );
    this.add(this._graphics);
    this._holdGroup = scene.make.group({});
    this.add(this._holdGroup.getChildren());

    this._label = scene.make
      .text({
        x,
        y: y - 24,
        text: t("labels.holdBox"),
        style: GUI_LABEL_HOLDBOX_STYLE,
      })
      .setOrigin(0, 0);
    this.add(this._label);

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
            .setOrigin(0.5);

          this._holdGroup.add(block);
        }
      });
    });

    this.add([...this._holdGroup.getChildren()]);
    this.centerHoldGroupInBox();
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

  private centerHoldGroupInBox(): void {
    const sprites =
      this._holdGroup.getChildren() as Phaser.GameObjects.Sprite[];

    if (sprites.length === 0) {
      return;
    }

    const union = sprites[0].getBounds();

    for (let i = 1; i < sprites.length; i++) {
      const b = sprites[i].getBounds();
      Phaser.Geom.Rectangle.Union(union, b, union);
    }

    const pieceCenterX = union.centerX;
    const pieceCenterY = union.centerY;

    const targetCenterX =
      this.x + (this._config.size ?? HoldBox.DEFAULT_SIZE) / 2;
    const targetCenterY =
      this.y + (this._config.size ?? HoldBox.DEFAULT_SIZE) / 2;

    const dx = targetCenterX - pieceCenterX;
    const dy = targetCenterY - pieceCenterY;

    sprites.forEach((s) => {
      s.x += dx;
      s.y += dy;
    });
  }
}
