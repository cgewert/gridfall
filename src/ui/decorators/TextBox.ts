import Phaser from "phaser";

export type TextBoxConfig = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  textStyle?: Phaser.Types.GameObjects.Text.TextStyle;
  fillColor?: string;
  fillAlpha?: number;
  useLinearBackground?: boolean; // Determines whether to use a linear gradient background or a solid color
};

/**
 * An extendable UI TextBox component with optional linear gradient background.
 * Extends Phaser.GameObjects.Container.
 */
export class TextBox extends Phaser.GameObjects.Container {
  protected background: Phaser.GameObjects.Rectangle;
  protected textObject: Phaser.GameObjects.Text;
  protected gradientImage?: Phaser.GameObjects.Image;
  protected padding: number = 10;
  protected gradientCanvas: Phaser.Textures.CanvasTexture | null = null;
  protected useLinearBackground: boolean = false;

  constructor(scene: Phaser.Scene, private config: TextBoxConfig) {
    super(scene, config.x, config.y);
    this.name = config.name;
    this.background = scene.add
      .rectangle(
        0,
        0,
        config.width + this.padding,
        config.height + this.padding,
        Phaser.Display.Color.HexStringToColor(config.fillColor || "#000000")
          .color,
        config.fillAlpha || 0.5
      )
      .setOrigin(0);
    this.textObject = scene.add.text(0, 0, config.text, config.textStyle);
    this.add([this.background, this.textObject]);
    this.alignText(true);

    this.UseLinearBackground = config.useLinearBackground || false;
  }

  public get ActualRenderWidth(): number {
    return this.background.displayWidth;
  }

  public get ActualRenderHeight(): number {
    return this.background.displayHeight;
  }

  public get UseLinearBackground(): boolean {
    return this.useLinearBackground;
  }

  public set UseLinearBackground(value: boolean) {
    this.useLinearBackground = value;
    if (value) {
      this.gradientCanvas = this.refreshGradient();
    } else {
      this.refreshBackground();
    }
  }

  public get Padding(): number {
    return this.padding;
  }

  public set Padding(value: number) {
    if (value < 0) value = 0;
    this.padding = value;
    // If a linear background is being used we dont modify the background width here below the initial width
    if (this.useLinearBackground) {
      this.background.width = Math.max(
        this.textObject.displayWidth + value,
        this.background.displayWidth
      );
    } else {
      this.background.width = this.textObject.displayWidth + value;
    }
    this.background.height = this.textObject.displayHeight + value;
    this.alignText(true);
  }

  public setText(newText: string): void {
    this.textObject.setText(newText);
    var sizeChanged = false;
    // Automatic width and height adjustment of background
    if (this.textObject.displayWidth > this.background.displayWidth) {
      this.background.width = this.textObject.displayWidth + this.Padding;
      sizeChanged = true;
    }
    if (this.textObject.displayHeight > this.background.displayHeight) {
      this.background.height = this.textObject.displayHeight + this.Padding;
      sizeChanged = true;
    }
    this.alignText(sizeChanged);
  }

  private alignText(sizeChanged: boolean): void {
    if (this.textObject && this.background) {
      if (!this.useLinearBackground) {
        Phaser.Display.Align.In.Center(this.textObject, this.background, 0, 0);
      } else {
        Phaser.Display.Align.In.LeftCenter(
          this.textObject,
          this.background,
          -this.Padding,
          0
        );
      }
      if (this.gradientImage && sizeChanged) {
        this.refreshGradient();
        Phaser.Display.Align.In.Center(
          this.gradientImage,
          this.background,
          0,
          0
        );
      }
    }
  }

  // TODO: When setting UseLinearBackground to true after it was false at creation time, the gradient is not visible. Fix that.
  /** Refreshes the gradient texture based on the current size of the background.
   * @param config - The configuration object for the TextBox.
   * @returns The created CanvasTexture or null if creation failed.
   */
  private refreshGradient(): Phaser.Textures.CanvasTexture | null {
    this.gradientImage?.destroy();
    this.gradientCanvas = null;

    if (this.scene.textures.exists(this.name)) {
      console.debug("TextBox: Removing existing gradient texture", this.name);
      this.scene.textures.remove(this.name);
    }
    const canvas = this.scene.textures.createCanvas(
      this.name,
      this.background.displayWidth,
      this.background.displayHeight
    );
    var context = canvas?.getContext();
    var grd = context?.createLinearGradient(
      0,
      this.background.displayHeight / 2,
      this.background.displayWidth,
      this.background.displayHeight / 2
    );

    if (grd && context && canvas) {
      const color = Phaser.Display.Color.HexStringToColor(
        this.config.fillColor || "#000000"
      );
      grd.addColorStop(
        0,
        `rgba(${color.red}, ${color.green}, ${color.blue}, 0.65)`
      );
      grd.addColorStop(
        0.5,
        `rgba(${color.red}, ${color.green}, ${color.blue}, 0.45)`
      );
      grd.addColorStop(
        1.0,
        `rgba(${color.red}, ${color.green}, ${color.blue}, 0.0)`
      );
      context.fillStyle = grd;
      context.fillRect(
        0,
        0,
        this.background.displayWidth,
        this.background.displayHeight
      );
      canvas.refresh();
      this.background.isFilled = false; // Make background fully transparent
      this.gradientImage = this.scene.add
        .image(0, 0, this.name)
        .setSize(this.background.displayWidth, this.background.displayHeight)
        .setVisible(true);
      this.add(this.gradientImage).bringToTop(this.textObject);
    } else {
      console.error("Failed to create gradient texture.");
    }

    return canvas;
  }

  /**
   * Refreshes the background to a solid color if linear background is disabled.
   */
  private refreshBackground(): void {
    if (!this.useLinearBackground) {
      this.gradientImage?.destroy();
      this.gradientCanvas?.destroy();
      this.gradientCanvas = null;
      this.background.isFilled = true;
    }
  }
}
