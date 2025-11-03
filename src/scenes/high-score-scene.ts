import * as Phaser from "phaser";
import { addScanlines, addSceneBackground } from "../effects/effects";
import { HighScoreSettings } from "../services/HighScoreSettings";
import { t } from "i18next";
import { Locale } from "../services/LanguageSettings";
import { SettingsEvents } from "../services/SettingsEvents";
import { AudioBus } from "../services/AudioBus";

export class HighscoreScene extends Phaser.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "HighscoreScene",
  };

  private parentKey?: string;
  private titleText!: Phaser.GameObjects.Text;
  private backText!: Phaser.GameObjects.Text;

  private titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Orbitron, sans-serif",
    fontSize: "48px",
    color: "#00ffff",
  };

  private labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Orbitron, sans-serif",
    fontSize: "28px",
    color: "#cfefff",
  };

  private valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Orbitron, sans-serif",
    fontSize: "22px",
    color: "#9ad",
  };

  private backStyle: Phaser.Types.GameObjects.Text.TextStyle = {
    fontFamily: "Orbitron, sans-serif",
    fontSize: "28px",
    color: "#888888",
  };

  constructor() {
    super(HighscoreScene.CONFIG);
  }

  public init(data: { parentKey?: string }) {
    this.parentKey = data?.parentKey;
  }

  public preload() {}

  public create() {
    const { width, height } = this.scale;

    addSceneBackground(this);
    addScanlines(this, { alpha: 0.12, speedY: 1.2 });

    this.titleText = this.add
      .text(width / 2, 80, t("labels.mnu-highscores"), this.titleStyle)
      .setOrigin(0.5)
      .setDepth(100);

    // Rush Highscore
    const rushData = HighScoreSettings.RushHighScore;
    this.createModeSection(
      width / 2,
      200,
      "Rush",
      rushData.time,
      rushData.score,
      "#ff6b6b"
    );

    // Ascent Highscore
    const ascentData = HighScoreSettings.AscentHighScore;
    this.createModeSection(
      width / 2,
      340,
      "Ascent",
      ascentData.time,
      ascentData.score,
      "#4ecdc4"
    );

    // Infinity Highscore
    const infinityData = HighScoreSettings.InfinityHighScore;
    this.createModeSection(
      width / 2,
      480,
      "Infinity",
      infinityData.time,
      infinityData.score,
      "#ffe66d"
    );

    this.backText = this.add
      .text(width / 2, height - 80, t("labels.back"), this.backStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.backText.setColor("#ffffff");
        AudioBus.PlaySfx(this, "ui-move");
      })
      .on("pointerout", () => this.backText.setColor("#888888"))
      .on("pointerdown", () => {
        AudioBus.PlaySfx(this, "ui-choose");
        this.closeScene();
      });

    // Keyboard controls
    this.input.keyboard!.on("keydown-ESC", () => this.closeScene());
    this.input.keyboard!.on("keydown-BACKSPACE", () => this.closeScene());

    // Language change handler
    this.game.events.on(
      SettingsEvents.LanguageChanged,
      this.onLanguageChange,
      this
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(SettingsEvents.LanguageChanged);
    });
  }

  private createModeSection(
    x: number,
    y: number,
    modeName: string,
    timeMs: number,
    score: number,
    color: string
  ) {
    const modeTitle = this.add
      .text(x, y, modeName, {
        ...this.labelStyle,
        color: color,
      })
      .setOrigin(0.5);

    const boxWidth = 500;
    const boxHeight = 90;
    const box = this.add
      .rectangle(x, y + 65, boxWidth, boxHeight, 0xffffff, 0.05)
      .setStrokeStyle(1, parseInt(color.replace("#", "0x")), 0.6);

    this.add
      .text(
        x - boxWidth / 2 + 20,
        y + 35,
        t("labels.best-time") + ":",
        this.valueStyle
      )
      .setOrigin(0, 0.5);

    const timeStr = this.formatTime(timeMs);
    this.add
      .text(x + boxWidth / 2 - 20, y + 35, timeStr, {
        ...this.valueStyle,
        color: timeMs > 0 ? "#00ff88" : "#666666",
      })
      .setOrigin(1, 0.5);

    this.add
      .text(
        x - boxWidth / 2 + 20,
        y + 70,
        t("labels.high-score") + ":",
        this.valueStyle
      )
      .setOrigin(0, 0.5);

    this.add
      .text(
        x + boxWidth / 2 - 20,
        y + 70,
        score > 0 ? score.toLocaleString() : "---",
        {
          ...this.valueStyle,
          color: score > 0 ? "#ffff00" : "#666666",
        }
      )
      .setOrigin(1, 0.5);
  }

  private formatTime(ms: number): string {
    if (ms === 0) return "--:--:--";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  private closeScene() {
    this.scene.stop();
    if (this.parentKey) {
      this.scene.bringToTop(this.parentKey);
    }
  }

  public onLanguageChange(e: { lang: Locale }) {
    this.titleText.setText(t("labels.mnu-highscores"));
    this.backText.setText(t("labels.back"));
  }
}
