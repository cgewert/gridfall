import { t } from "i18next";
import { GUI_LABEL_HOLDBOX_STYLE } from "../fonts";

export type NextPreviewConfig = {
  borderThickness?: number;
  width?: number;
  height?: number;
  fillColor?: number;
  fillAlpha?: number;
  borderColor?: number;
};

export class NextPreview extends Phaser.GameObjects.Container {
  private _config: NextPreviewConfig;
  private nextBoxGraphics!: Phaser.GameObjects.Graphics;
  private _label!: Phaser.GameObjects.Text;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config?: NextPreviewConfig
  ) {
    super(scene, x, y);
    this._config = config || {};
    this.init();
  }

  public get Bounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.x,
      this.y,
      this._config.width ?? 120,
      this._config.height ?? 120
    );
  }

  private init(): void {
    const borderThickness = this._config.borderThickness ?? 5;
    const width = this._config.width ?? 120;
    const height = this._config.height ?? 120;
    const fillColor = this._config.fillColor ?? 0x000000;
    const fillAlpha = this._config.fillAlpha ?? 1;
    const borderColor = this._config.borderColor ?? 0xffffff;

    this.nextBoxGraphics = this.scene.make.graphics();
    this.nextBoxGraphics.clear();
    this.nextBoxGraphics.fillStyle(fillColor, fillAlpha);
    this.nextBoxGraphics.fillRect(this.x, this.y, width, height);
    this.nextBoxGraphics.lineStyle(borderThickness, borderColor, 1);
    this.nextBoxGraphics.strokeRect(this.x, this.y, width, height);
    this.add(this.nextBoxGraphics);

    this._label = this.scene.make
      .text({
        x: this.x,
        y: this.y - 30,
        text: t("labels.nextBox"),
        style: GUI_LABEL_HOLDBOX_STYLE,
      })
      .setOrigin(0, 0);
    this.add(this._label);

    this.scene.add.existing(this);
  }

  public centerGroupInBox(group: Phaser.GameObjects.Group): void {
    const sprites = group.getChildren() as Phaser.GameObjects.Sprite[];
    if (sprites.length === 0) return;

    const union = sprites[0].getBounds();
    for (let i = 1; i < sprites.length; i++) {
      const b = sprites[i].getBounds();
      Phaser.Geom.Rectangle.Union(union, b, union);
    }

    const pieceCenterX = union.centerX;
    const pieceCenterY = union.centerY;

    const targetCenterX = this.Bounds.centerX;
    const targetCenterY = this.Bounds.centerY;

    const dx = targetCenterX - pieceCenterX;
    const dy = targetCenterY - pieceCenterY;

    sprites.forEach((s) => {
      s.x += dx;
      s.y += dy;
    });
  }
}
