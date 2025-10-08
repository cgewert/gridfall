// src/scenes/menus/GeneralMenuScene.ts
import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { LanguageSettings, LOCALE_NAME } from "../../services/LanguageSettings";

export class GeneralMenuScene extends BaseMenuScene {
  public static readonly KEY = "GeneralMenuScene";
  public static readonly HINT = "↑/↓ Auswahl · ←/→ ändern · ESC/B zurück";

  private entries: {
    label: Phaser.GameObjects.Text;
    value: Phaser.GameObjects.Text;
    bg: Phaser.GameObjects.Rectangle;
    cx: number;
    cy: number;
    w: number;
    h: number;
  }[] = [];

  private activeIndex = 0;

  // keyboard handler-refs
  private onUp!: () => void;
  private onDown!: () => void;
  private onLeft!: () => void;
  private onRight!: () => void;
  private onEsc!: () => void;

  public constructor() {
    super(GeneralMenuScene.KEY, "General Settings");
  }

  public create(data: { parentKey?: string } = {}): void {
    super.create(data);

    this.addLanguageRow(0, -20);
    this.setActiveIndex(0);

    // Keyboard
    const k = this.input.keyboard!;
    this.onUp = () => this.setActiveIndex(this.activeIndex - 1);
    this.onDown = () => this.setActiveIndex(this.activeIndex + 1);
    this.onLeft = () => this.onChange(-1);
    this.onRight = () => this.onChange(+1);
    this.onEsc = () => this.close();

    k.on("keydown-UP", this.onUp);
    k.on("keydown-DOWN", this.onDown);
    k.on("keydown-LEFT", this.onLeft);
    k.on("keydown-RIGHT", this.onRight);

    // TODO: Gamepad input will be supported later
    // this.input.gamepad?.on("down", this.onPadDown, this);

    // Cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  private addLanguageRow(idx: number, y: number) {
    const cx = 0,
      w = 560,
      h = 48;

    const bg = this.add
      .rectangle(cx, y, w, h, 0xffffff, 0.06)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0x00ffff, 0.6);
    const label = this.add
      .text(cx - w / 2 + 14, y, "Language", {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "22px",
        color: "#9ad",
      })
      .setOrigin(0, 0.5);
    const val = LOCALE_NAME[LanguageSettings.get()];
    const value = this.add
      .text(cx + w / 2 - 14, y, val, {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "22px",
        color: "#cfefff",
      })
      .setOrigin(1, 0.5);

    // Maus: Klick links/rechts Hälfte = prev/next + Fokus holen
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.setActiveIndex(idx);
      if (p.x < this.cameras.main.centerX) this.changeLanguage(-1);
      else this.changeLanguage(+1);
    });

    this.modal.add([bg, label, value]);
    this.entries.push({ label, value, bg, cx, cy: y, w, h });
  }

  private setActiveIndex(i: number) {
    if (!this.entries.length) return;
    this.activeIndex = (i + this.entries.length) % this.entries.length;

    this.entries.forEach((e, idx) => {
      const focused = idx === this.activeIndex;
      e.bg.setStrokeStyle(focused ? 2 : 1, 0x00ffff, focused ? 1.0 : 0.6);
      e.bg.setScale(focused ? 1.02 : 1.0);
      e.label.setStyle({ color: focused ? "#cfefff" : "#9ad" });
    });
  }

  private onChange(dir: -1 | 1) {
    if (this.activeIndex === 0) this.changeLanguage(dir);
  }

  private changeLanguage(dir: -1 | 1) {
    if (dir < 0) LanguageSettings.prev();
    else LanguageSettings.next();
    const e = this.entries[0];
    e.value.setText(LOCALE_NAME[LanguageSettings.get()]);
    this.tweens.add({
      targets: e.value,
      scale: 1.06,
      duration: 80,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  //   private onPadDown(_pad: any, btn: any, val: number) {
  //     if (val === 0) return;
  //     const idx = typeof btn === "number" ? btn : btn.index;
  //     if (idx === 12) this.setActiveIndex(this.activeIndex - 1); // Dpad Up
  //     if (idx === 13) this.setActiveIndex(this.activeIndex + 1); // Dpad Down
  //     if (idx === 14) this.onChange(-1); // Dpad Left
  //     if (idx === 15) this.onChange(+1); // Dpad Right
  //     if (idx === 1) this.close(); // B / Circle
  //   }

  private onShutdown() {
    console.log("Shutting down GeneralMenuScene...");
    const k = this.input.keyboard!;
    k.off("keydown-UP", this.onUp);
    k.off("keydown-W", this.onUp);
    k.off("keydown-DOWN", this.onDown);
    k.off("keydown-S", this.onDown);
    k.off("keydown-LEFT", this.onLeft);
    k.off("keydown-A", this.onLeft);
    k.off("keydown-RIGHT", this.onRight);
    k.off("keydown-D", this.onRight);
    k.off("keydown-ESC", this.onEsc);
    // this.input.gamepad?.off("down", this.onPadDown, this);

    this.tweens.killAll();
    this.entries = [];
    this.time.clearPendingEvents();
    this.input.removeAllListeners();
  }
}
