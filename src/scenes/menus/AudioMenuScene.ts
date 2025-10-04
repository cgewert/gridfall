import { AudioSettings } from "../../services/AudioSettings";
import { AudioBus } from "../../services/AudioBus";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { t } from "i18next";

export class AudioMenuScene extends BaseMenuScene {
  private musicFill!: Phaser.GameObjects.Rectangle;
  private sfxFill!: Phaser.GameObjects.Rectangle;
  private labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Orbitron, sans-serif",
    fontSize: "22px",
  };

  constructor() {
    super("AudioMenuScene", "Audio");
  }

  create(data: { parentKey?: string } = {}) {
    super.create(data);

    // Music volume slider
    this.createSlider(
      0,
      0,
      t("labels.sliderMusicVolume"),
      () => AudioSettings.MusicVolume,
      (v) => this.setMusic(v)
    );
    // SFX volume slider
    this.createSlider(
      0,
      100,
      t("labels.sliderSfxVolume"),
      () => AudioSettings.SfxVolume,
      (v) => this.setSfx(v)
    );
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
    label: string,
    getter: () => number,
    setter: (v: number) => void
  ) {
    const sliderWidth = 420;
    const sliderHeight = 16;

    const sliderLabel = this.add
      .text(cx - sliderWidth / 2, cy, label, this.labelStyle)
      .setOrigin(0, 1);
    sliderLabel.setY(sliderLabel.y - sliderLabel.height);
    this.modal.add(sliderLabel);

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

    if (label === "Music") this.musicFill = fill;
    else this.sfxFill = fill;

    // TODO: Don't support pointer input for now

    // bg.setInteractive({ useHandCursor: true });
    // const onPointer = (pointer: Phaser.Input.Pointer) => {
    //   const rel = Phaser.Math.Clamp((pointer.x - (cx - w / 2)) / w, 0, 1);
    //   setter(rel);
    // };
    // bg.on("pointerdown", onPointer);
    // bg.on("pointermove", (p: Phaser.Input.Pointer) => {
    //   if (p.isDown) onPointer(p);
    // });

    this.input.keyboard?.on("keydown-LEFT", () =>
      setter(Phaser.Math.Clamp(getter() - 0.05, 0, 1))
    );
    this.input.keyboard?.on("keydown-RIGHT", () =>
      setter(Phaser.Math.Clamp(getter() + 0.05, 0, 1))
    );
  }

  private setMusic(v: number) {
    AudioSettings.MusicVolume = v;
    console.debug("Set music volume to", v);
    if (this.musicFill) this.musicFill.width = Math.max(6, v * 420);
    this.applyToParent();
  }
  private setSfx(v: number) {
    AudioSettings.SfxVolume = v;
    console.debug("Set SFX volume to", v);
    if (this.sfxFill) this.sfxFill.width = Math.max(6, v * 420);
    this.applyToParent();
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
}
