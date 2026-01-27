import Phaser from "phaser";
import { TextBox, TextBoxConfig } from "./TextBox";
import { DEFAULT_MENU_FONT } from "../../fonts";

/**
 * Configuration options for TimerDisplay.
 * Extends TextBoxConfig.
 */
export type TimerDisplayConfig = TextBoxConfig & {
  autostart?: boolean;
  prefix?: string;
  stroke?: string;
  strokeThickness?: number;
  align?: "left" | "center" | "right";
};

export class TimerDisplay extends TextBox {
  private _running = false;
  private _time = 0; // accumulated time in ms
  private _lastStartNow = 0; // last start time (ms, scene.time.now)
  private _prefix: string; // Prefix rendered before the time
  private static _instance_counter = 0;

  constructor(
    scene: Phaser.Scene,
    config: TimerDisplayConfig = {
      name: "TimerDisplay",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      text: "",
      textStyle: {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "32px",
        color: "#FFFFFF",
      },
      fillColor: "#000000",
      fillAlpha: 0.5,
      useLinearBackground: true,
      autostart: true,
      prefix: "TIME: ",
      align: "left",
    },
  ) {
    TimerDisplay._instance_counter++;

    console.debug(
      "TimerDisplay: Creating instance",
      TimerDisplay._instance_counter,
    );

    super(scene, {
      ...config,
      name: config.name + "_" + TimerDisplay._instance_counter,
    });

    this._prefix = config.prefix ?? "";
    this.setText(`${this._prefix} ${this.format(0)}`);

    if (config.stroke) {
      this.textObject.setStroke(config.stroke, config.strokeThickness ?? 2);
    }

    this.textObject.setOrigin(0, 0.5);

    // Hook this object into the scene update loop
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    });

    if (config.autostart) this.start();
  }

  /** Starts or resumes the timer. */
  public start(): void {
    if (this._running) return;
    this._running = true;
    this._time = 0;
    this._lastStartNow = this.scene.time.now;
  }

  /** Pauses the timer. */
  public pause(): void {
    if (!this._running) return;
    this._time += this.scene.time.now - this._lastStartNow;
    this._running = false;
    // Update display immediately
    this.setText(this._prefix + this.format(this._time));
  }

  /** Stops the timer (like reset, but without resetting the display). */
  public stop(): void {
    this._running = false;
    this._time = 0;
  }

  /** Stops and resets the timer to 0. */
  public reset(): void {
    this._running = false;
    this._time = 0;
    this.setText(this._prefix + this.format(0));
  }

  /** Resumes the timer if paused. */
  public resume(): void {
    if (this._running) return;
    this._running = true;
    this._lastStartNow = this.scene.time.now;
  }

  /** Sets the display to a specific ms time. */
  public setElapsedMs(ms: number): void {
    const clamped = Math.max(0, ms | 0);
    this._time = clamped;
    if (this._running) this._lastStartNow = this.scene.time.now;
    this.setText(this._prefix + this.format(clamped));
  }

  /** Returns the current elapsed time in milliseconds. */
  public getElapsedMs(): number {
    if (!this._running) return this._time;
    const now = this.scene.time.now;
    return this._time + (now - this._lastStartNow);
  }

  /** Sets an optional prefix string. */
  public setPrefix(p: string): void {
    this._prefix = p ?? "";
    this.setText(this._prefix + this.format(this.getElapsedMs()));
  }

  public setTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): void {
    this.textObject.setStyle(style);
  }

  /**
   * Callback for scene update event.
   */
  private onUpdate(): void {
    if (!this._running) return;
    const ms = this.getElapsedMs();
    this.setText(this._prefix + this.format(ms));
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
