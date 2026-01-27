import { t } from "i18next";
import { InputSettings } from "../../services/InputSettings";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { AudioBus } from "../../services/AudioBus";
import { DEFAULT_MENU_FONT } from "../../fonts";

type SliderRef = {
  name: "DAS" | "ARR" | "SDF";
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  get: () => number;
  set: (v: number) => void;
  format: (v: number) => string;
  step: number;
  min: number;
  max: number;
  w: number;
  h: number;
  leftX: number; // left edge of the slider bar (inside modal)
  cy: number;
};

export class ControlsMenuScene extends BaseMenuScene {
  public static readonly KEY = "ControlsMenuScene";
  private static readonly HINT = "hints.mnu-controls";
  private static readonly CONTENT_PADDING_LEFT = 50;

  private sliders: SliderRef[] = [];
  private activeIndex = 0;

  private onReset!: () => void;
  private onUp!: () => void;
  private onDown!: () => void;
  private onLeft!: () => void;
  private onRight!: () => void;

  // Computed left edge inside the modal container (local coords)
  private contentLeftX = 0;

  constructor() {
    super(ControlsMenuScene.KEY, "labels.mnu-controls", ControlsMenuScene.HINT);
  }

  create(data: { parentKey?: string } = {}): void {
    super.create(data);

    AudioBus.AddSceneAudio(this, "settings-reset");

    // Compute the modal width (fallback if bounds are 0 for any reason)
    const modalBounds = this.modal.getBounds();
    const modalW =
      modalBounds.width && modalBounds.width > 0
        ? modalBounds.width
        : Math.min(760, this.scale.width - 80);

    // If the modal background is centered at (0,0) in modal-local space,
    // its left edge is -modalW/2. Add padding.
    this.contentLeftX = -modalW / 2 - ControlsMenuScene.CONTENT_PADDING_LEFT;

    // Slider rows (all left-aligned)
    this.addSlider(
      -30,
      "DAS",
      () => InputSettings.DAS,
      (v) => InputSettings.setDAS(v),
      (v) => `${v} ms`,
      5,
      0,
      250,
    );
    this.addSlider(
      50,
      "ARR",
      () => InputSettings.ARR,
      (v) => InputSettings.setARR(v),
      (v) => `${v} ms`,
      1,
      0,
      100,
    );
    this.addSlider(
      130,
      "SDF",
      () => InputSettings.SDF,
      (v) => InputSettings.setSDF(v),
      (v) => `${v} ${t("units.cells/s")}`,
      1,
      1,
      80,
    );

    this.setActiveSlider(0);

    const k = this.input.keyboard!;
    this.onUp = () => this.setActiveSlider(this.activeIndex - 1);
    this.onDown = () => this.setActiveSlider(this.activeIndex + 1);
    this.onLeft = () => this.nudgeActive(-1);
    this.onRight = () => this.nudgeActive(+1);
    this.onReset = () => this.resetDefaults();

    k.on("keydown-UP", this.onUp);
    k.on("keydown-DOWN", this.onDown);
    k.on("keydown-LEFT", this.onLeft);
    k.on("keydown-RIGHT", this.onRight);
    k.on("keydown-R", this.onReset);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.onShutdown, this);
    this.events.on(Phaser.Scenes.Events.SLEEP, this.onShutdown, this);
  }

  public preload(): void {
    this.load.audio("settings-reset", "assets/audio/sfx/settings-reset.ogg");
  }

  private addSlider(
    cy: number,
    name: "DAS" | "ARR" | "SDF",
    get: () => number,
    set: (v: number) => void,
    format: (v: number) => string,
    step: number,
    min: number,
    max: number,
  ) {
    const w = 520;
    const h = 16;

    const leftX = this.contentLeftX;
    const barCenterX = leftX + w / 2;

    const label = this.add
      .text(leftX, cy - 36, name, {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "22px",
        color: "#9ad",
      })
      .setOrigin(0, 1);

    const bg = this.add
      .rectangle(barCenterX, cy, w, h, 0xffffff, 0.08)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x00ffff, 0.6);

    const norm = (get() - min) / (max - min);
    const fill = this.add
      .rectangle(leftX, cy, Math.max(6, norm * w), h, 0x00ffff, 0.75)
      .setOrigin(0, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    const value = this.add
      .text(leftX + w + 14, cy, format(get()), {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "18px",
        color: "#cfefff",
      })
      .setOrigin(0, 0.5);

    this.modal.add([label, bg, fill, value]);

    this.sliders.push({
      name,
      bg,
      fill,
      label,
      value,
      get,
      set,
      format,
      step,
      min,
      max,
      w,
      h,
      leftX,
      cy,
    });
  }

  private setActiveSlider(i: number) {
    if (!this.sliders.length) return;
    this.activeIndex = (i + this.sliders.length) % this.sliders.length;

    this.sliders.forEach((s, idx) => {
      const focused = idx === this.activeIndex;
      s.bg.setStrokeStyle(focused ? 2 : 1, 0x00ffff, focused ? 1.0 : 0.6);
      s.bg.setScale(focused ? 1.02 : 1.0);
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

  private nudgeActive(dir: -1 | 1) {
    const s = this.sliders[this.activeIndex];
    if (!s) return;

    const cur = s.get();
    const next = Phaser.Math.Clamp(cur + dir * s.step, s.min, s.max);
    if (next === cur) return;

    s.set(next);

    const rel = (next - s.min) / (s.max - s.min);
    s.fill.width = Math.max(6, rel * s.w);
    s.value.setText(s.format(next));

    this.tweens.add({
      targets: s.fill,
      alpha: 1,
      duration: 60,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private onShutdown() {
    const k = this.input.keyboard!;
    k.off("keydown-UP", this.onUp);
    k.off("keydown-DOWN", this.onDown);
    k.off("keydown-LEFT", this.onLeft);
    k.off("keydown-RIGHT", this.onRight);
    k.off("keydown-R", this.onReset);
    //this.input.gamepad?.off("down", this.onPadDown, this);
    this.tweens.killTweensOf(this.modal.list);
    this.tweens.killTweensOf(this.modal);
    //this.time.clearPendingEvents();
    //this.input.removeAllListeners();
    this.sliders = [];
  }

  private resetDefaults() {
    InputSettings.resetToDefaults();
    this.refreshSlidersFromStore();

    // Feedback
    AudioBus.PlaySfx(this, "settings-reset");
  }

  private refreshSlidersFromStore() {
    for (const s of this.sliders) {
      const v = s.get();
      const rel = (v - s.min) / (s.max - s.min);
      s.fill.width = Math.max(6, rel * s.w);
      s.value.setText(s.format(v));
    }
  }

  protected onEntranceCompleted(): void {}
  protected beforeClose(): void {}
}
