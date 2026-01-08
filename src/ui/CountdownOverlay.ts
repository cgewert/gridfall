import Phaser from "phaser";
import { AudioSettings } from "../services/AudioSettings";

// src/ui/CountdownOverlay.ts
export type CountdownOptions = {
  from?: number;
  intervalMs?: number;
  beepSoundKey?: string;
  onFinished: () => void;
};

export class CountdownOverlay {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private current: number;
  private timer?: Phaser.Time.TimerEvent;
  private _volume = 1.0;
  private _isPaused = false;
  private opts!: CountdownOptions;

  public get Volume() {
    return this._volume;
  }
  public set Volume(v: number) {
    this._volume = Phaser.Math.Clamp(v, 0, 1);
  }

  public get Paused() {
    return this._isPaused;
  }
  public set Paused(v: boolean) {
    this._isPaused = v;
    if (v) {
      this.stop();
    } else {
      this.start(this.opts);
    }
  }

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const { width, height } = scene.scale;

    this.text = scene.add
      .text(width / 2, height / 2, "", {
        fontFamily: "Orbitron",
        fontSize: "128px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(10_000)
      .setVisible(false);

    this.current = 3;
  }

  public start(opts: CountdownOptions) {
    this.opts = opts;
    this._isPaused = false;
    const from = opts.from ?? 3;
    const intervalMs = opts.intervalMs ?? 1000;
    const beepKey = opts.beepSoundKey;

    this.stop();
    this.current = from;
    this.text.setVisible(true);
    this.showNumber(this.current, beepKey);

    this.timer = this.scene.time.addEvent({
      delay: intervalMs,
      loop: true,
      callback: () => {
        this.tick();
      },
    });
  }

  public stop() {
    if (this.timer) {
      this.timer.remove(false);
      this.timer = undefined;
    }
    this.stopVisual();
  }

  private stopVisual() {
    this.text.setVisible(false);
    this.text.setText("");
  }

  private tick() {
    this.current--;

    if (this.current <= 0) {
      this.stopVisual();
      this.opts.onFinished();
      return;
    }

    this.showNumber(this.current, this.opts.beepSoundKey);
  }

  private showNumber(n: number, beepKey?: string) {
    this.text.setText(String(n));

    this.text.setScale(1.5);
    this.scene.tweens.add({
      targets: this.text,
      scale: 1,
      duration: 120,
      ease: "Sine.Out",
    });

    const rate = (3 - this.current + 1) * 0.33;

    if (beepKey) {
      const s = this.scene.sound.get(beepKey);
      if (s?.isPlaying) s.stop();
      this.scene.sound.play(beepKey, {
        volume: AudioSettings.SfxVolume ?? this.Volume,
        rate: Phaser.Math.Clamp(1 + rate, 1.0, 2.0),
      });
    }
  }

  public destroy() {
    this.stop();
    this.text.destroy();
  }
}
