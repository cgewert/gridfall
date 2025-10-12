// src/scenes/menus/ControlsMenuScene.ts
import { t } from "i18next";
import { InputSettings } from "../../services/InputSettings";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";

type SliderRef = {
  name: "DAS" | "ARR" | "SDF";
  cx: number;
  cy: number;
  w: number;
  h: number;
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
};

export class ControlsMenuScene extends BaseMenuScene {
  public static readonly KEY = "ControlsMenuScene";
  private static readonly HINT = "hints.mnu-controls";

  private sliders: SliderRef[] = [];
  private activeIndex = 0;

  private onUp!: () => void;
  private onDown!: () => void;
  private onLeft!: () => void;
  private onRight!: () => void;

  constructor() {
    super(ControlsMenuScene.KEY, "labels.mnu-controls", ControlsMenuScene.HINT);
  }

  create(data: { parentKey?: string } = {}): void {
    super.create(data);

    // Slider rows
    this.addSlider(
      0,
      -30,
      "DAS",
      () => InputSettings.DAS,
      (v) => InputSettings.setDAS(v),
      (v) => `${v} ms`,
      5,
      0,
      250
    );
    this.addSlider(
      0,
      50,
      "ARR",
      () => InputSettings.ARR,
      (v) => InputSettings.setARR(v),
      (v) => `${v} ms`,
      1,
      0,
      100
    );
    this.addSlider(
      0,
      130,
      "SDF",
      () => InputSettings.SDF,
      (v) => InputSettings.setSDF(v),
      (v) => `${v} tiles/s`,
      1,
      1,
      80
    );

    this.setActiveSlider(0);

    const k = this.input.keyboard!;
    this.onUp = () => this.setActiveSlider(this.activeIndex - 1);
    this.onDown = () => this.setActiveSlider(this.activeIndex + 1);
    this.onLeft = () => this.nudgeActive(-1);
    this.onRight = () => this.nudgeActive(+1);

    k.on("keydown-UP", this.onUp);
    k.on("keydown-DOWN", this.onDown);
    k.on("keydown-LEFT", this.onLeft);
    k.on("keydown-RIGHT", this.onRight);

    // TODO: Gamepad support will be added later
    //this.input.gamepad?.on("down", this.onPadDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private addSlider(
    cx: number,
    cy: number,
    name: "DAS" | "ARR" | "SDF",
    get: () => number,
    set: (v: number) => void,
    format: (v: number) => string,
    step: number,
    min: number,
    max: number
  ) {
    const w = 520,
      h = 16;
    const label = this.add
      .text(cx - w / 2, cy - 36, name, {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "22px",
        color: "#9ad",
      })
      .setOrigin(0, 1);

    const bg = this.add
      .rectangle(cx, cy, w, h, 0xffffff, 0.08)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x00ffff, 0.6);

    const norm = (get() - min) / (max - min);
    const fill = this.add
      .rectangle(cx - w / 2, cy, Math.max(6, norm * w), h, 0x00ffff, 0.75)
      .setOrigin(0, 0.5)
      .setBlendMode(Phaser.BlendModes.ADD);

    const value = this.add
      .text(cx + w / 2 + 14, cy, format(get()), {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "18px",
        color: "#cfefff",
      })
      .setOrigin(0, 0.5);

    // TODO: Consider: No pointer interaction for now, maybe later

    // bg.setInteractive({ useHandCursor: true });
    // const onPointer = (p: Phaser.Input.Pointer) => {
    //   this.focusByName(name);
    //   const rel = Phaser.Math.Clamp((p.x - (cx - w / 2)) / w, 0, 1);
    //   const val = Math.round(min + rel * (max - min));
    //   set(val);
    //   fill.width = Math.max(6, rel * w);
    //   value.setText(format(val));
    // };
    // bg.on("pointerdown", onPointer);
    // bg.on("pointermove", (p: Phaser.Input.Pointer) => {
    //   if (p.isDown) onPointer(p);
    // });

    this.modal.add([label, bg, fill, value]);

    this.sliders.push({
      name,
      cx,
      cy,
      w,
      h,
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

  private focusByName(name: SliderRef["name"]) {
    const idx = this.sliders.findIndex((s) => s.name === name);
    if (idx >= 0) this.setActiveSlider(idx);
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

  // TODO: Gamepad support will be added later
  //   private onPadDown(_pad: any, btn: any, val: number) {
  //     if (val === 0) return;
  //     const idx = typeof btn === "number" ? btn : btn.index;
  //     if (idx === 12) this.setActiveSlider(this.activeIndex - 1); // Up
  //     if (idx === 13) this.setActiveSlider(this.activeIndex + 1); // Down
  //     if (idx === 14) this.nudgeActive(-1); // Left
  //     if (idx === 15) this.nudgeActive(+1); // Right
  //     if (idx === 1) this.close(); // B/Circle
  //   }

  private onShutdown() {
    const k = this.input.keyboard!;
    k.off("keydown-UP", this.onUp);
    k.off("keydown-DOWN", this.onDown);
    k.off("keydown-LEFT", this.onLeft);
    k.off("keydown-RIGHT", this.onRight);
    //this.input.gamepad?.off("down", this.onPadDown, this);
    this.tweens.killAll();
    this.time.clearPendingEvents();
    this.input.removeAllListeners();
    this.sliders = [];
  }

  protected onEntranceCompleted(): void {}
  protected beforeClose(): void {}
}
