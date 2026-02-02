import * as Phaser from "phaser";
import { DEFAULT_MENU_FONT } from "../fonts";

export type SnackbarType = "info" | "error" | "success" | "warning";

export type SnackbarConfig = {
  width?: number;
  minHeight?: number;
  padding?: number;
  margin?: number;
  depth?: number;
};

type SnackbarItem = {
  message: string;
  type: SnackbarType;
  durationMs: number;
};

export class Snackbar {
  private static readonly DEFAULT_WIDTH = 520;
  private static readonly DEFAULT_MIN_HEIGHT = 64;
  private static readonly DEFAULT_PADDING = 16;
  private static readonly DEFAULT_MARGIN = 24;

  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;

  private width: number;
  private minHeight: number;
  private padding: number;
  private margin: number;
  private isShowing = false;
  private queue: SnackbarItem[] = [];
  private hideTimer?: Phaser.Time.TimerEvent;
  private tween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, config?: SnackbarConfig) {
    this.scene = scene;
    this.width = config?.width ?? Snackbar.DEFAULT_WIDTH;
    this.minHeight = config?.minHeight ?? Snackbar.DEFAULT_MIN_HEIGHT;
    this.padding = config?.padding ?? Snackbar.DEFAULT_PADDING;
    this.margin = config?.margin ?? Snackbar.DEFAULT_MARGIN;

    this.background = scene.add.graphics();
    this.text = scene.add.text(0, 0, "", {
      fontFamily: DEFAULT_MENU_FONT,
      fontSize: "22px",
      color: "#ffffff",
      align: "center",
      wordWrap: {
        width: this.width - this.padding * 2,
        useAdvancedWrap: true,
      },
    });

    this.container = scene.add
      .container(0, 0, [this.background, this.text])
      .setDepth(config?.depth ?? 2000)
      .setVisible(false)
      .setAlpha(0);

    this.scene.scale.on("resize", this.handleResize, this);
  }

  public show(
    message: string,
    type: SnackbarType = "info",
    durationMs = 3000,
  ): void {
    this.queue.push({ message, type, durationMs });
    this.processQueue();
  }

  public hide(): void {
    if (!this.isShowing) return;
    this.stopTimers();
    this.fadeOut();
  }

  public destroy(): void {
    this.stopTimers();
    this.scene.scale.off("resize", this.handleResize, this);
    this.container.destroy(true);
  }

  private processQueue(): void {
    if (this.isShowing) return;
    const next = this.queue.shift();
    if (!next) return;
    this.display(next);
  }

  private display(item: SnackbarItem): void {
    this.isShowing = true;
    this.draw(item.message, item.type);
    this.position();

    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.container.y += 12;

    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: this.container.y - 12,
      duration: 180,
      ease: "Sine.Out",
      onComplete: () => {
        this.hideTimer = this.scene.time.addEvent({
          delay: item.durationMs,
          callback: () => this.fadeOut(),
        });
      },
    });
  }

  private fadeOut(): void {
    this.tween?.stop();
    this.tween = this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      y: this.container.y + 12,
      duration: 180,
      ease: "Sine.In",
      onComplete: () => {
        this.container.setVisible(false);
        this.isShowing = false;
        this.processQueue();
      },
    });
  }

  private stopTimers(): void {
    if (this.hideTimer) {
      this.hideTimer.remove(false);
      this.hideTimer = undefined;
    }
    this.tween?.stop();
  }

  private draw(message: string, type: SnackbarType): void {
    const colors = this.getTypeColors(type);
    this.text.setText(message);
    this.text.setFixedSize(this.width - this.padding * 2, this.text.height);

    const textHeight = this.text.height;
    const height = Math.max(this.minHeight, textHeight + this.padding * 2);

    this.background.clear();
    this.background.fillStyle(colors.bg, 0.95);
    this.background.fillRoundedRect(0, 0, this.width, height, 10);
    this.background.lineStyle(2, colors.border, 1);
    this.background.strokeRoundedRect(0, 0, this.width, height, 10);

    this.text.setPosition(this.padding, (height - textHeight) / 2);
    this.container.setSize(this.width, height);
  }

  private position(): void {
    const { width, height } = this.scene.scale;
    const x = (width - this.container.width) / 2;
    const y = height - this.container.height - this.margin;
    this.container.setPosition(x, y);
  }

  private handleResize(): void {
    if (this.container.visible) this.position();
  }

  private getTypeColors(type: SnackbarType): { bg: number; border: number } {
    switch (type) {
      case "error":
        return { bg: 0x2b0d0d, border: 0xff4d4d };
      case "success":
        return { bg: 0x0e2b12, border: 0x4dff77 };
      case "warning":
        return { bg: 0x2b240d, border: 0xffd24d };
      default:
        return { bg: 0x0d1a2b, border: 0x4db2ff };
    }
  }
}
