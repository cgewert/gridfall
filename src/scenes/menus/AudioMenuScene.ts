import { AudioSettings } from "../../services/AudioSettings";
import { AudioBus } from "../../services/AudioBus";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { t } from "i18next";

type SliderRef = {
  name: "Music" | "SFX";
  cx: number;
  cy: number;
  width: number;
  height: number;
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  getter: () => number;
  setter: (v: number) => void;
};

export class AudioMenuScene extends BaseMenuScene {
  private musicFill!: Phaser.GameObjects.Rectangle;
  private sfxFill!: Phaser.GameObjects.Rectangle;
  private sliders: SliderRef[] = [];
  private activeIndex = 0;
  private labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Orbitron, sans-serif",
    fontSize: "22px",
  };

  constructor() {
    super("AudioMenuScene", "labels.mnu-audio");
  }

  create(data: { parentKey?: string } = {}) {
    super.create(data);

    // Music volume slider
    this.createSlider(
      0,
      0,
      "Music",
      () => AudioSettings.MusicVolume,
      (v) => this.setMusic(v)
    );
    // SFX volume slider
    this.createSlider(
      0,
      100,
      "SFX",
      () => AudioSettings.SfxVolume,
      (v) => this.setSfx(v)
    );

    this.input.keyboard?.on("keydown-UP", () =>
      this.setActiveSlider(this.activeIndex - 1)
    );
    this.input.keyboard?.on("keydown-DOWN", () =>
      this.setActiveSlider(this.activeIndex + 1)
    );
    this.input.keyboard?.on("keydown-LEFT", () => this.nudgeActive(-0.05));
    this.input.keyboard?.on("keydown-RIGHT", () => this.nudgeActive(+0.05));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.setActiveSlider(0);
  }

  /***
   * Creates a simple horizontal slider.
   * @param cx Center X position
   * @param cy Center Y position
   * @param label Label text
   * @param getter Function to get the current value (0 to 1)
   * @param setter Function to set the new value (0 to 1)
   */
  private createSlider(
    cx: number,
    cy: number,
    name: "Music" | "SFX",
    getter: () => number,
    setter: (v: number) => void
  ) {
    const sliderWidth = 420;
    const sliderHeight = 16;

    const bg = this.add
      .rectangle(cx, cy, sliderWidth, sliderHeight, 0xffffff, 0.08)
      .setStrokeStyle(1, 0x00ffff, 0.8);
    const fill = this.add
      .rectangle(
        cx - sliderWidth / 2,
        cy,
        Math.max(6, getter() * sliderWidth), // TODO: Rework for 100 % values
        sliderHeight,
        0x00ffff,
        0.6
      )
      .setOrigin(0, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.modal.add([bg, fill]);

    let sliderLabel;
    if (name === "Music") {
      sliderLabel = this.add
        .text(
          cx - sliderWidth / 2,
          cy,
          t("labels.sliderMusicVolume"),
          this.labelStyle
        )
        .setOrigin(0, 1);
      sliderLabel.setY(sliderLabel.y - sliderLabel.height);
      this.musicFill = fill;
    } else {
      this.sfxFill = fill;
      sliderLabel = this.add
        .text(
          cx - sliderWidth / 2,
          cy,
          t("labels.sliderSfxVolume"),
          this.labelStyle
        )
        .setOrigin(0, 1);
      sliderLabel.setY(sliderLabel.y - sliderLabel.height);
    }
    this.modal.add(sliderLabel);
    this.sliders.push({
      name,
      cx,
      cy,
      width: sliderWidth,
      height: sliderHeight,
      bg,
      fill,
      label: sliderLabel,
      getter,
      setter,
    });
  }

  private setMusic(v: number) {
    AudioSettings.MusicVolume = v;
    console.debug("Set music volume to", v);
    if (this.musicFill) this.musicFill.width = Math.max(6, v * 420);
    this.applyToParent();
  }

  private setSfx(v: number) {
    const oldValue = AudioSettings.SfxVolume;
    if (v === oldValue) return;
    AudioSettings.SfxVolume = v;
    console.debug("Set SFX volume to", v);
    if (this.sfxFill) this.sfxFill.width = Math.max(6, v * 420);
    this.applyToParent();
    if (v > 0 && v <= 1) AudioBus.PlaySfx(this, "ui-move");
  }

  /**
   * Applies the audio settings to all registered sound and sfx.
   */
  private applyToParent() {
    AudioBus.ApplySettings(this);
    if (this.parentKey) {
      const parent = this.scene.get(this.parentKey) as Phaser.Scene | undefined;
      parent && AudioBus.ApplySettings(parent);
    }
  }

  private setActiveSlider(i: number) {
    if (!this.sliders.length) return;
    this.activeIndex = (i + this.sliders.length) % this.sliders.length;

    this.sliders.forEach((s, idx) => {
      const focused = idx === this.activeIndex;
      s.bg.setStrokeStyle(focused ? 2 : 1, 0x00ffff, focused ? 1.0 : 0.6);
      s.bg.setScale(focused ? 1.0 : 1.0);
      s.label.setStyle({ color: focused ? "#cfefff" : "#9ad" });
      if (focused) {
        this.tweens.add({
          targets: s.bg,
          scaleX: 1.03,
          duration: 140,
          yoyo: true,
          ease: "Sine.easeInOut",
        });
      }
    });
  }

  private nudgeActive(delta: number) {
    const s = this.sliders[this.activeIndex];
    if (!s) return;
    const next = Phaser.Math.Clamp(s.getter() + delta, 0, 1);
    s.setter(next);
    s.fill.width = Math.max(6, next * s.width);
    this.tweens.add({
      targets: s.fill,
      alpha: 1,
      duration: 60,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private onShutdown() {
    this.tweens.killAll();
    this.sliders = [];
  }
}
