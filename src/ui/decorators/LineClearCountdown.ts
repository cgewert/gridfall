import Phaser from "phaser";
import { Decoratable } from "./decorator";

export type LineClearCountdownConfig = {
  x: number;
  y: number;

  /** Starting value */
  limit: number;

  textStyle?: Phaser.Types.GameObjects.Text.TextStyle;

  /** Optional: If you want to set left/right/center */
  origin?: { x: number; y: number };

  /** Optional: Formatting, e.g. (v) => `${v}` or `LINES: ${v}` */
  formatter?: (value: number) => string;
};

export class LineClearCountdown
  extends Phaser.GameObjects.Container
  implements Decoratable
{
  private _limit: number;
  private _value: number;

  private readonly _text: Phaser.GameObjects.Text;
  private readonly _formatter: (value: number) => string;

  public get Limit(): number {
    return this._limit;
  }

  public get Value(): number {
    return this._value;
  }

  public get ActualRenderWidth(): number {
    return this.displayWidth;
  }

  public get ActualRenderHeight(): number {
    return this.displayHeight;
  }

  constructor(scene: Phaser.Scene, config: LineClearCountdownConfig) {
    super(scene, config.x, config.y);

    this._limit = Math.max(0, Math.floor(config.limit));
    this._value = this._limit;

    this._formatter = config.formatter ?? ((v) => `${v}`);

    this._text = scene.add.text(
      0,
      0,
      this._formatter(this._value),
      config.textStyle
    );
    const origin = config.origin ?? { x: 0.5, y: 0.5 };
    this._text.setOrigin(origin.x, origin.y);

    this.add(this._text);
    this.setDepth(500);
    scene.add.existing(this);
  }

  public get UseAutoAlign(): boolean {
    return false;
  }

  public applyLineClears(linesCleared: number): void {
    const n = Math.max(0, Math.floor(linesCleared));
    if (n === 0 || this._value === 0) return;

    this._value = Math.max(0, this._value - n);
    this._text.setText(this._formatter(this._value));
  }

  public setLimit(limit: number, resetValue: boolean = true): void {
    this._limit = Math.max(0, Math.floor(limit));
    if (resetValue) {
      this._value = this._limit;
      this._text.setText(this._formatter(this._value));
    }
  }

  public setValue(value: number): void {
    const v = Math.max(0, Math.floor(value));
    this._value = Math.min(this._limit, v);
    this._text.setText(this._formatter(this._value));
  }

  public reset(): void {
    this._value = this._limit;
    this._text.setText(this._formatter(this._value));
  }

  public setTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): void {
    this._text.setStyle(style);
  }

  public get TextObject(): Phaser.GameObjects.Text {
    return this._text;
  }

  public fitIntoRect(
    rect: Phaser.Geom.Rectangle,
    options?: {
      padding?: number;
      minFontSize?: number;
      maxFontSize?: number;
    }
  ): void {
    const padding = options?.padding ?? 10;
    const minFontSize = options?.minFontSize ?? 12;
    const maxFontSize = options?.maxFontSize ?? 256;

    const targetW = Math.max(1, rect.width - padding * 2);
    const targetH = Math.max(1, rect.height - padding * 2);

    this.setPosition(rect.centerX, rect.y + rect.height / 4);

    let lo = minFontSize;
    let hi = maxFontSize;
    let best = minFontSize;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      this._text.setFontSize(mid);

      const bounds = this._text.getBounds(); // World bounds

      if (bounds.width <= targetW && bounds.height <= targetH) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    this._text.setFontSize(best);
    this._text.setPosition(0, 0);
  }
}
