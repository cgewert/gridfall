import * as Phaser from "phaser";
import { DEFAULT_MENU_FONT } from "../fonts";

export type OnlineBadgeConfig = {
  width?: number;
  height?: number;
  padding?: number;
  depth?: number;
};

export class OnlineBadge extends Phaser.GameObjects.Container {
  public static readonly DEFAULT_WIDTH = 300;
  public static readonly DEFAULT_HEIGHT = 150;
  private static readonly DEFAULT_PADDING = 15;

  private readonly _width: number;
  private readonly _height: number;
  private readonly _padding: number;

  private _background: Phaser.GameObjects.Image;
  private _nameText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config?: OnlineBadgeConfig,
  ) {
    super(scene, x, y);

    this._width = config?.width ?? OnlineBadge.DEFAULT_WIDTH;
    this._height = config?.height ?? OnlineBadge.DEFAULT_HEIGHT;
    this._padding = config?.padding ?? OnlineBadge.DEFAULT_PADDING;

    const textureKey = OnlineBadge.createGradientTexture(
      scene,
      this._width,
      this._height,
    );

    this._background = scene.add.image(0, 0, textureKey).setOrigin(0, 0);

    this._nameText = scene.add
      .text(this._width / 2, this._height / 2, "", {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        wordWrap: {
          width: this._width - this._padding * 2,
          useAdvancedWrap: true,
        },
      })
      .setOrigin(0.5)
      .setFixedSize(
        this._width - this._padding * 2,
        this._height - this._padding * 2,
      );

    this.add([this._background, this._nameText]);

    this.setSize(this._width, this._height);
    this.setVisible(false);
    if (config?.depth !== undefined) this.setDepth(config.depth);

    scene.add.existing(this);
  }

  public setPlayerName(name: string): void {
    this._nameText.setText(name);
  }

  private static createGradientTexture(
    scene: Phaser.Scene,
    width: number,
    height: number,
  ): string {
    const key = `online-badge-bg-${width}x${height}`;
    if (scene.textures.exists(key)) return key;

    const canvasTexture = scene.textures.createCanvas(key, width, height);
    const ctx = canvasTexture?.getContext();
    const gradient = ctx?.createLinearGradient(0, 0, 0, height);
    gradient?.addColorStop(0, "#2a2a2a");
    gradient?.addColorStop(0.08, "#111111");
    gradient?.addColorStop(0.18, "#000000");
    gradient?.addColorStop(1, "#000000");
    if (ctx?.fillStyle && gradient) {
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    canvasTexture?.refresh();

    return key;
  }
}
