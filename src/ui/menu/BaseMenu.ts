import Phaser from "phaser";
import { addScanlines } from "../../effects/effects";
import { Locale } from "../../services/LanguageSettings";
import { t } from "i18next";
import { SettingsEvents } from "../../services/SettingsEvents";

export abstract class BaseMenuScene extends Phaser.Scene {
  protected parentKey?: string;
  /*** Content container for the menu */
  protected modal!: Phaser.GameObjects.Container;
  protected contentBox!: Phaser.GameObjects.Rectangle;
  protected title!: string; // Set the translation identifier for the title here
  protected hint!: string; // Set the translation identifier for the hint here
  protected textStyleTitle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Orbitron, sans-serif",
    fontSize: "42px",
    stroke: "#00ffff",
    strokeThickness: 1,
  };
  protected textStyleHint: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "sans-serif",
    fontSize: "16px",
    color: "#9ad",
  };
  protected textTitle!: Phaser.GameObjects.Text;
  protected textHint!: Phaser.GameObjects.Text;

  constructor(key: string, title?: string, hint?: string) {
    super(key);
    this.title = title || "Menu";
    this.hint = hint || "hints.mnu-default";
  }

  public get TextStyleTitle(): Phaser.Types.GameObjects.Text.TextStyle {
    return this.textStyleTitle;
  }

  public set TextStyleTitle(value: Phaser.Types.GameObjects.Text.TextStyle) {
    this.textStyleTitle = value;
  }

  public get TextStyleHint(): Phaser.Types.GameObjects.Text.TextStyle {
    return this.textStyleHint;
  }

  public set TextStyleHint(value: Phaser.Types.GameObjects.Text.TextStyle) {
    this.textStyleHint = value;
  }

  public create(data: { parentKey?: string } = {}): void {
    const { width, height } = this.scale;
    this.parentKey = data.parentKey;

    // Create non transparent, dark Background
    this.contentBox = this.add
      .rectangle(0, 0, width, height, 0x000000, 1.0)
      .setOrigin(0)
      .setInteractive();

    // Add scanline effect
    addScanlines(this, { alpha: 0.12, speedY: 1.2 });

    // Create content panel
    this.modal = this.add.container(width * 0.5, height * 0.52);
    const panelWidth = 720;
    const panelHeight = 440;
    const radius = 16;
    const g = this.add.graphics();

    g.fillStyle(0x070a0f, 0.92);
    g.fillRoundedRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      radius
    );
    g.lineStyle(2, 0x00ffff, 0.85);
    g.strokeRoundedRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      radius
    );
    this.modal.add(g);

    // Entrance animation
    this.modal.setScale(0.92).setAlpha(0);
    this.tweens.add({
      targets: this.modal,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: "Quad.easeOut",
      onComplete: () => this.onEntranceCompleted(),
    });

    // Add menu title
    this.textTitle = this.add
      .text(0, -panelHeight / 2 + 60, t(this.title), this.textStyleTitle)
      .setOrigin(0.5);
    this.modal.add(this.textTitle);

    // Add controls hint
    this.textHint = this.add
      .text(0, panelHeight / 2 - 36, t(this.hint), this.textStyleHint)
      .setOrigin(0.5);
    this.modal.add(this.textHint);

    this.input.keyboard?.on("keydown-ESC", () => this.close());
    // TODO: Gamepad input will be supported later
    // this.input.gamepad?.on("down", (_pad: any, btn: any, val: number) => {
    //   if (val === 0) return;
    //   const idx = typeof btn === "number" ? btn : btn.index;
    //   if (idx === 1) this.close();
    // });
  }

  /** Will be called when the entrance animation is completed */
  protected abstract onEntranceCompleted(): void;

  /** Will be called before the menu starts closing */
  protected abstract beforeClose(): void;

  /**
   * Updates the menus text when the language changes.
   * @param lang - New language code
   */
  protected onLanguageChange(_lang: Locale) {
    this.textTitle.setText(t(this.title));
    this.textHint.setText(t(this.hint));
  }

  protected close(): void {
    this.tweens.add({
      targets: this.modal,
      alpha: 0,
      scale: 0.96,
      duration: 140,
      ease: "Quad.easeIn",
      onStart: () => this.beforeClose(),
      onComplete: () => this.scene.stop(),
    });

    // Desubscribe from language changes
    this.events.off(
      SettingsEvents.LanguageChanged,
      this.onLanguageChange,
      this
    );
  }
}
