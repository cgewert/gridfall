import Phaser from "phaser";
import { addScanlines } from "../../effects/effects";

export abstract class BaseMenuScene extends Phaser.Scene {
  protected parentKey?: string;
  protected modal!: Phaser.GameObjects.Container;
  protected title!: string;

  constructor(key: string, title?: string) {
    super(key);
    this.title = title || "Menu";
  }

  public create(data: { parentKey?: string } = {}): void {
    const { width, height } = this.scale;
    this.parentKey = data.parentKey;

    this.add
      .rectangle(0, 0, width, height, 0x000000, 1.0)
      .setOrigin(0)
      .setInteractive();

    addScanlines(this, { alpha: 0.12, speedY: 1.2 });
    this.modal = this.add.container(width * 0.5, height * 0.52);

    const panelW = 720,
      panelH = 440,
      r = 16;
    const g = this.add.graphics();
    g.fillStyle(0x070a0f, 0.92);
    g.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, r);
    g.lineStyle(2, 0x00ffff, 0.85);
    g.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, r);
    this.modal.add(g);

    // Entrance animation
    this.modal.setScale(0.92).setAlpha(0);
    this.tweens.add({
      targets: this.modal,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: "Quad.easeOut",
    });

    // Add menu title
    const title = this.add
      .text(0, -panelH / 2 + 60, this.title, {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "42px",
        stroke: "#00ffff",
        strokeThickness: 1,
      })
      .setOrigin(0.5);
    this.modal.add(title);

    // Add back hint
    const hint = this.add
      .text(0, panelH / 2 - 36, "ESC / B: Back", {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#9ad",
      })
      .setOrigin(0.5);
    this.modal.add(hint);

    this.input.keyboard?.on("keydown-ESC", () => this.close());
    this.input.gamepad?.on("down", (_pad: any, btn: any, val: number) => {
      if (val === 0) return;
      const idx = typeof btn === "number" ? btn : btn.index;
      if (idx === 1) this.close();
    });
  }

  protected close(): void {
    this.tweens.add({
      targets: this.modal,
      alpha: 0,
      scale: 0.96,
      duration: 140,
      ease: "Quad.easeIn",
      onComplete: () => this.scene.stop(),
    });
  }
}
