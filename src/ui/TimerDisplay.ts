import Phaser from "phaser";

/**
 * Configuration options for TimerDisplay.
 */
export type TimerDisplayOptions = {
  x?: number; // Position on x-axis
  y?: number; // Position on y-axis
  autostart?: boolean; // automatically start the timer
  prefix?: string; // e.g. "TIME "
  fontFamily?: string; // e.g. "Orbitron"
  fontSize?: number; // px
  color?: string; // e.g. "#FFFFFF"
  stroke?: string; // outline color
  strokeThickness?: number;
  shadow?: boolean; // text shadow for better readability
  alpha?: number; // transparency
  depth?: number;
  align?: "left" | "center" | "right";
};

export class TimerDisplay extends Phaser.GameObjects.Container {
  private _text!: Phaser.GameObjects.Text;

  private _running = false;
  private _accumulatedMs = 0; // accumulated time in ms
  private _lastStartNow = 0; // last start time (ms, scene.time.now)
  private _prefix: string;

  constructor(scene: Phaser.Scene, opts: TimerDisplayOptions = {}) {
    const x = opts.x ?? 0;
    const y = opts.y ?? 0;

    super(scene, x, y);

    this._prefix = opts.prefix ?? "";
    this._text = scene.make.text(
      {
        x: 0,
        y: 0,
        text: this.format(0),
        style: {
          fontFamily: opts.fontFamily ?? "Orbitron, monospace",
          fontSize: `${opts.fontSize ?? 32}px`,
          color: opts.color ?? "#FFFFFF",
          align: opts.align ?? "left",
        },
      },
      false
    );

    if (opts.stroke) {
      this._text.setStroke(opts.stroke, opts.strokeThickness ?? 2);
    }
    if (opts.shadow) {
      this._text.setShadow(0, 2, "#000000", 4, true, true);
    }
    this._text.setOrigin(0, 0.5);
    this.add(this._text);

    if (opts.alpha !== undefined) this.setAlpha(opts.alpha);
    if (opts.depth !== undefined) this.setDepth(opts.depth);

    scene.add.existing(this);

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    });

    if (opts.autostart) this.start();
  }

  /** Starts or resumes the timer. */
  public start(): void {
    if (this._running) return;
    this._running = true;
    this._lastStartNow = this.scene.time.now;
  }

  /** Pauses the timer. */
  public pause(): void {
    if (!this._running) return;
    const now = this.scene.time.now;
    this._accumulatedMs += now - this._lastStartNow;
    this._running = false;
    // Update display immediately
    this._text.setText(this._prefix + this.format(this._accumulatedMs));
  }

  /** Stops the timer (like reset, but without resetting the display). */
  public stop(): void {
    this._running = false;
    this._accumulatedMs = 0;
  }

  /** Stops and resets the timer to 0. */
  public reset(): void {
    this._running = false;
    this._accumulatedMs = 0;
    this._text.setText(this._prefix + this.format(0));
  }

  /** Resumes the timer if paused. Alias for start(). */
  public resume(): void {
    this.start();
  }

  /** Sets the display to a specific ms time. */
  public setElapsedMs(ms: number): void {
    const clamped = Math.max(0, ms | 0);
    this._accumulatedMs = clamped;
    if (this._running) this._lastStartNow = this.scene.time.now;
    this._text.setText(this._prefix + this.format(clamped));
  }

  /** Returns the current elapsed time in milliseconds. */
  public getElapsedMs(): number {
    if (!this._running) return this._accumulatedMs;
    const now = this.scene.time.now;
    return this._accumulatedMs + (now - this._lastStartNow);
  }

  /** Optional: Change the prefix (e.g. "SPRINT "). */
  public setPrefix(p: string): void {
    this._prefix = p ?? "";
    this._text.setText(this._prefix + this.format(this.getElapsedMs()));
  }

  /** Text style can also be adjusted later. */
  public setTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): void {
    this._text.setStyle(style);
  }

  /** Size/scale of the entire component can be adjusted as usual via setScale(). */
  public override setScale(x: number, y?: number): this {
    super.setScale(x, y);
    return this;
  }

  override setPosition(x?: number, y?: number, z?: number, w?: number): this {
    return super.setPosition(x, y, z, w);
  }

  /**
   * Callback for scene update event.
   */
  private onUpdate(): void {
    if (!this._running) return;

    const ms = this.getElapsedMs();
    this._text.setText(this._prefix + this.format(ms));
  }

  /** Format hh:mm:ss:ms (ms = 3-digits). */
  public format(msTotal: number): string {
    const ms = Math.floor(msTotal % 1000);
    const totalSeconds = Math.floor(msTotal / 1000);
    const s = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const m = totalMinutes % 60;
    const h = Math.floor(totalMinutes / 60);

    const p2 = (n: number) => n.toString().padStart(2, "0");
    const p3 = (n: number) => n.toString().padStart(3, "0");

    return `${p2(h)}:${p2(m)}:${p2(s)}:${p3(ms)}`;
  }
}
