import Phaser from "phaser";
import { MenuItem, MenuItemConfig } from "./MenuItem";
import { AudioBus } from "../../services/AudioBus";

export interface MenuListConfig {
  x: number;
  y: number;
  gap?: number;
  items: MenuItemConfig[];
  onChooseSoundKey?: string;
  onMoveSoundKey?: string;
}

export class MenuList extends Phaser.GameObjects.Container {
  private items: MenuItem[] = [];
  private index = 0;
  private gap: number;
  private sfxChoose?: Phaser.Sound.BaseSound;
  private sfxMove?: Phaser.Sound.BaseSound;

  constructor(scene: Phaser.Scene, cfg: MenuListConfig) {
    super(scene, cfg.x, cfg.y);
    this.gap = cfg.gap ?? 56;

    if (cfg.onChooseSoundKey)
      this.sfxChoose = AudioBus.AddSceneAudio(scene, cfg.onChooseSoundKey);
    if (cfg.onMoveSoundKey)
      this.sfxMove = AudioBus.AddSceneAudio(scene, cfg.onMoveSoundKey);

    cfg.items.forEach((it, i) => {
      const item = new MenuItem(scene, 0, i * this.gap, it);
      item.on("choose", () => this.choose());
      this.add(item);
      this.items.push(item);
    });

    this.setDepth(5);
    scene.add.existing(this);

    this.index = this.findNextEnabled(0, +1) ?? 0;
    this.applyFocus();
    this.enableKeyboard(scene);
    this.enableGamepad(scene);
  }

  private enableKeyboard(scene: Phaser.Scene) {
    const k = scene.input.keyboard!;
    k.on("keydown-UP", () => this.move(-1));
    k.on("keydown-W", () => this.move(-1));
    k.on("keydown-DOWN", () => this.move(+1));
    k.on("keydown-S", () => this.move(+1));
    k.on("keydown-ENTER", () => this.choose());
    k.on("keydown-SPACE", () => this.choose());
  }

  /***
   * Selects a menu item by its label text.
   */
  public selectItem(label: string) {
    const index = this.items.findIndex((item) => item.labelText.text === label);
    if (index !== -1) {
      this.index = index;
      this.applyFocus();
    }
  }

  private enableGamepad(scene: Phaser.Scene) {
    scene.input.gamepad?.on("down", (_pad: any, button: any, value: any) => {
      if (value === 0) return;
      const idx = typeof button === "number" ? button : button.index;
      if (idx === 0) this.choose(); // A / Cross
      if (idx === 12) this.move(-1); // Dpad Up
      if (idx === 13) this.move(+1); // Dpad Down
    });
  }

  private move(dir: 1 | -1) {
    const next = this.findNextEnabled(this.index + dir, dir);
    if (next == null) return;
    this.index = next;
    this.applyFocus();
    AudioBus.PlaySfx(this.scene, "ui-move");
  }

  private choose() {
    const cur = this.items[this.index];

    this.scene.tweens.add({
      targets: cur,
      scale: 1.15,
      duration: 70,
      yoyo: true,
      ease: "Quad.easeOut",
    });

    AudioBus.PlaySfx(this.scene, "ui-choose");
    cur.Action();
  }

  private applyFocus() {
    this.items.forEach((it, i) => it.setFocused(i === this.index));
    const targetY = 150 - this.index * this.gap;
    this.scene.tweens.add({
      targets: this.listContainer,
      y: targetY,
      duration: 180,
      ease: "Quad.easeOut",
    });
  }

  private get listContainer(): Phaser.GameObjects.Container {
    return this;
  }

  private isEnabled(i: number) {
    const it = this.items[i];
    return it && !it.disabled;
  }

  private findNextEnabled(start: number, dir: 1 | -1): number | null {
    if (!this.items.length) return null;
    let i = (start + this.items.length) % this.items.length;
    for (let c = 0; c < this.items.length; c++) {
      if (this.isEnabled(i)) return i;
      i = (i + dir + this.items.length) % this.items.length;
    }
    return null;
  }

  public beat(intensity: number) {
    const cur = this.items[this.index];
    cur?.beatPulse(intensity);
  }
}
