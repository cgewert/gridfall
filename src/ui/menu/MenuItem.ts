import Phaser from "phaser";
import { Locale } from "../../services/LanguageSettings";
import { t } from "i18next";

export type MenuAction = () => void;

export interface MenuItemConfig {
  identifier: string; // Unique identifier for the menu item
  label: string; // Translatable label text
  translatable: boolean; // Whether the label is translatable
  action: MenuAction;
  disabled?: boolean;
  meta?: Record<string, any>;
  description?: string;
}

export class MenuItem extends Phaser.GameObjects.Container {
  public readonly labelText: Phaser.GameObjects.Text;
  public descriptionText?: string;
  public readonly glow: Phaser.GameObjects.Rectangle;
  public disabled: boolean;

  private readonly _identifier: string;
  private readonly _translatable: boolean;
  private readonly baseScale = 1;
  private hoverScale = 1.03;
  private focusScale = 1.08;
  private action: MenuAction = () => {};

  public get Identifier(): string {
    return this._identifier;
  }

  public get Translatable(): boolean {
    return this._translatable;
  }

  public get Action(): MenuAction {
    return this.action;
  }

  public set Action(a: MenuAction) {
    this.action = a;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: MenuItemConfig) {
    super(scene, x, y);
    this.disabled = !!cfg.disabled;
    const { action, label, description, identifier, translatable } = cfg;

    this.action = action;
    this.descriptionText = description;
    this._identifier = identifier;
    this._translatable = translatable;

    this.glow = scene.add
      .rectangle(0, 0, 480, 44, 0x00ffff, 0.12)
      .setOrigin(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0);
    this.add(this.glow);

    this.labelText = scene.add
      .text(0, 0, label, {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "28px",
        fontStyle: this.disabled ? "italic" : "normal",
        color: this.disabled ? "#888" : "#ffffff",
        stroke: "#00ffff",
        strokeThickness: this.disabled ? 0 : 1,
        shadow: {
          blur: 8,
          fill: true,
          offsetX: 0,
          offsetY: 0,
          color: "#00ffff",
        },
      })
      .setOrigin(0.5);

    this.add(this.labelText);

    this.setSize(520, 48);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-260, -24, 520, 48),
      Phaser.Geom.Rectangle.Contains
    );

    this.on("pointerover", () => {
      if (!this.disabled) this.hoverOn();
    });
    this.on("pointerout", () => {
      if (!this.disabled) this.hoverOff();
    });
    this.on("pointerdown", () => {
      if (!this.disabled) this.emit("choose");
    });

    this.alpha = 0;

    scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 220,
      ease: "Quad.easeOut",
    });
  }

  public setFocused(focused: boolean) {
    if (this.disabled) return;
    const targetScale = focused ? this.focusScale : this.baseScale;
    this.scene.tweens.add({
      targets: this,
      scale: targetScale,
      duration: 140,
      ease: "Quad.easeOut",
    });
    this.scene.tweens.add({
      targets: this.glow,
      alpha: focused ? 0.45 : 0,
      duration: 140,
      ease: "Quad.easeOut",
    });
  }

  public beatPulse(intensity: number) {
    if (this.glow.alpha > 0) {
      this.scale = 1.08 + intensity * 0.5;
    }
  }

  public hoverOn() {
    if (this.disabled) return;
    this.scene.tweens.add({
      targets: this,
      scale: this.hoverScale,
      duration: 100,
      ease: "Quad.easeOut",
    });
  }

  public hoverOff() {
    if (this.disabled) return;
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      duration: 100,
      ease: "Quad.easeOut",
    });
  }

  public updateText(lang: Locale): void {
    if (this.Translatable) {
      this.labelText.setText(t(`labels.${this._identifier}`));
    }
    if (this.descriptionText) {
      this.descriptionText = t(`descriptions.${this._identifier}`);
    }
  }
}
