import { AudioSettings } from "../../services/AudioSettings";
import { AudioBus } from "../../services/AudioBus";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";

export class AudioMenuScene extends BaseMenuScene {
  private musicVal = 0.6;
  private sfxVal = 0.8;

  private musicFill!: Phaser.GameObjects.Rectangle;
  private sfxFill!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("AudioMenuScene", "Audio");
  }

  create(data: { parentKey?: string } = {}) {
    super.create(data);

    // TODO: Use phaser container alignment instead of manual positioning, delay text creation until after modal is created

    // Werte aus Settings
    this.musicVal = AudioSettings.MusicVolume;
    this.sfxVal = AudioSettings.SfxVolume;

    // Slider (einfach)
    this.createSlider(
      this.scale.width / 2,
      260,
      "Music",
      () => this.musicVal,
      (v) => this.setMusic(v)
    );
    this.createSlider(
      this.scale.width / 2,
      360,
      "SFX",
      () => this.sfxVal,
      (v) => this.setSfx(v)
    );
  }

  private createSlider(
    cx: number,
    cy: number,
    label: string,
    getter: () => number,
    setter: (v: number) => void
  ) {
    const w = 420,
      h = 16;

    this.add
      .text(cx - w / 2, cy - 36, label, {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "22px",
      })
      .setOrigin(0, 1);

    const bg = this.add
      .rectangle(cx, cy, w, h, 0xffffff, 0.08)
      .setStrokeStyle(1, 0x00ffff, 0.8);
    const fill = this.add
      .rectangle(cx - w / 2, cy, Math.max(6, getter() * w), h, 0x00ffff, 0.6)
      .setOrigin(0, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    // für live-Update merken
    if (label === "Music") this.musicFill = fill;
    else this.sfxFill = fill;

    // Maussteuerung
    bg.setInteractive({ useHandCursor: true });
    const onPointer = (pointer: Phaser.Input.Pointer) => {
      const rel = Phaser.Math.Clamp((pointer.x - (cx - w / 2)) / w, 0, 1);
      setter(rel);
    };
    bg.on("pointerdown", onPointer);
    bg.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown) onPointer(p);
    });

    // Tastatursteuerung (links/rechts)
    this.input.keyboard?.on("keydown-LEFT", () =>
      setter(Phaser.Math.Clamp(getter() - 0.05, 0, 1))
    );
    this.input.keyboard?.on("keydown-RIGHT", () =>
      setter(Phaser.Math.Clamp(getter() + 0.05, 0, 1))
    );
    this.input.keyboard?.on("keydown-A", () =>
      setter(Phaser.Math.Clamp(getter() - 0.05, 0, 1))
    );
    this.input.keyboard?.on("keydown-D", () =>
      setter(Phaser.Math.Clamp(getter() + 0.05, 0, 1))
    );
  }

  private setMusic(v: number) {
    AudioSettings.MusicVolume = v;
    if (this.musicFill) this.musicFill.width = Math.max(6, v * 420);
    this.applyToParent();
  }
  private setSfx(v: number) {
    AudioSettings.SfxVolume = v;
    if (this.sfxFill) this.sfxFill.width = Math.max(6, v * 420);
    this.applyToParent();
  }

  private applyToParent() {
    AudioBus.ApplySettings(this);
    if (this.parentKey) {
      const parent = this.scene.get(this.parentKey) as Phaser.Scene | undefined;
      parent && AudioBus.ApplySettings(parent);
    }
  }
}
