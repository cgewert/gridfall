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
  private descContainer!: Phaser.GameObjects.Container;
  private descBox!: Phaser.GameObjects.Rectangle;
  private descText!: Phaser.GameObjects.Text;

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

    this.setScrollFactor(0);
    this.setDepth(5);

    this.index = this.findNextEnabled(0, +1) ?? 0;
    this.applyFocus();
    this.enableKeyboard(scene);
    this.enableGamepad(scene);

    this.descContainer = scene.add.container(260, 0);
    this.descBox = scene.add
      .rectangle(0, 0, 380, 110, 0x070a0f, 0.88)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x00ffff, 0.65);
    this.descText = scene.add
      .text(12, 0, "", {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "16px",
        color: "#cfefff",
        wordWrap: { width: 380 - 24 },
      })
      .setOrigin(0, 0.5);
    this.descContainer.add([this.descBox, this.descText]);
    this.descContainer.setAlpha(0);
    this.add(this.descContainer);

    scene.add.existing(this);
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
      if (idx === 0) this.choose();
      if (idx === 12) this.move(-1);
      if (idx === 13) this.move(+1);
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

    const focusedItem = this.items[this.index];
    const text = focusedItem.descriptionText ?? "";
    if (text) {
      this.descText?.setText(text);
      if (this.descBox && this.descText)
        Phaser.Display.Align.In.Center(this.descText, this.descBox);
      if (this.descContainer?.alpha < 1) {
        this.scene.tweens.add({
          targets: this.descContainer,
          alpha: 1,
          duration: 120,
          ease: "Quad.easeOut",
        });
      }
    } else {
      if (this.descContainer?.alpha > 0) {
        this.scene.tweens.add({
          targets: this.descContainer,
          alpha: 0,
          duration: 100,
          ease: "Quad.easeOut",
        });
      }
    }
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
