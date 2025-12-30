import * as Phaser from "phaser";
import { addScanlines, addSceneBackground } from "../effects/effects";
import { HighscoreService } from "../services/HighScoreService";
import { t } from "i18next";
import { Locale } from "../services/LanguageSettings";
import { SettingsEvents } from "../services/SettingsEvents";
import { AudioBus } from "../services/AudioBus";
import { MillisecondsToTimeString } from "../game";

type StackOptions = {
  spacing?: number;
  align?: "left" | "center" | "right";
};

function layoutVerticalStack(
  items: Phaser.GameObjects.Container[],
  startX: number,
  startY: number,
  opts?: StackOptions
): void {
  const spacing = opts?.spacing ?? 18;
  //const align = opts?.align ?? "left";

  let y = startY;

  for (const item of items) {
    const b = item.getBounds();

    // if (align === "left") item.x = startX;
    // if (align === "center") item.x = startX;
    // if (align === "right") item.x = startX;
    item.x = startX;
    item.y = y;

    y += b.height + spacing;
  }
}

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
    const marginTop = 150;
    const marginX = 80;

    addSceneBackground(this);
    addScanlines(this, { alpha: 0.12, speedY: 1.2 });

    const root = this.add.container(0, 0);
    const sections: Phaser.GameObjects.Container[] = [];

    this.titleText = this.add
      .text(width / 2, 80, t("labels.mnu-highscores"), this.titleStyle)
      .setOrigin(0.5)
      .setDepth(100);

    root.add(this.titleText);

    // Rush Highscore
    const rushData = HighscoreService.getRushBest();
    if (rushData !== null) {
      const rushSection = this.createModeSectionRush(width - marginX * 2);
      root.add(rushSection);
      sections.push(rushSection);
    }
    // Später:
    // sections.push(this.createAscentSection(...))
    // sections.push(this.createInfinitySection(...))

    layoutVerticalStack(sections, marginX, marginTop, {
      spacing: 20,
      align: "left",
    });
    // // Ascent Highscore
    // const ascentData = HighscoreService.getAscentBest();
    // this.createModeSection(
    //   width / 2,
    //   340,
    //   "Ascent",
    //   ascentData.time,
    //   ascentData.score,
    //   "#4ecdc4"
    // );

    // // Infinity Highscore
    // const infinityData = HighScoreSettings.InfinityHighScore;
    // this.createModeSection(
    //   width / 2,
    //   480,
    //   "Infinity",
    //   infinityData.time,
    //   infinityData.score,
    //   "#ffe66d"
    // );

    this.backText = this.add
      .text(width / 2, height - 80, t("labels.back"), this.backStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.backText.setColor("#ffffff");
        AudioBus.PlaySfx(this, "ui-move");
      })
      .on("pointerout", () => this.backText.setColor("#888888"));
    // TODO: Add mouse support later
    // .on("pointerdown", () => {
    //   AudioBus.PlaySfx(this, "ui-choose");
    //   this.closeScene();
    // });

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

  private createModeSectionRush(
    sectionWidth: number
  ): Phaser.GameObjects.Container {
    const section = this.add.container(0, 0);

    const padding = 18;
    const headerH = 48;
    const rowH = 44;
    const sectionHeight = headerH + 10 + rowH + padding * 2;

    const bg = this.add
      .rectangle(0, 0, sectionWidth, sectionHeight, 0x000000, 0.55)
      .setOrigin(0, 0);
    bg.setStrokeStyle(4, 0xffffff, 1);

    section.add(bg);

    // Header
    const title = this.add
      .text(padding, padding, "RUSH (40 LINES)", {
        fontFamily: "Orbitron, Arial, sans-serif",
        fontSize: "26px",
        color: "#ffffff",
      })
      .setOrigin(0, 0);

    section.add(title);

    const colY = padding + headerH;
    const colStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Orbitron, Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
    };

    const colTime = this.add
      .text(padding, colY, "TIME", colStyle)
      .setOrigin(0, 0);
    const colLines = this.add
      .text(padding + 260, colY, "LINES", colStyle)
      .setOrigin(0, 0);
    const colDate = this.add
      .text(padding + 380, colY, "DATE", colStyle)
      .setOrigin(0, 0);

    colTime.setAlpha(0.8);
    colLines.setAlpha(0.8);
    colDate.setAlpha(0.8);

    section.add([colTime, colLines, colDate]);

    const bestTimes = HighscoreService.getRushTimes(3);

    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "Orbitron, Arial, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
    };

    let rowY = colY + 26;

    bestTimes.forEach((entry, index) => {
      const timeStr = MillisecondsToTimeString(entry.timeMs);
      const linesStr = String(entry.linesCleared);
      const dateStr = this.formatDate(entry.achievedAt);
      const vTime = this.add
        .text(padding, rowY, timeStr, valueStyle)
        .setOrigin(0, 0);
      const vLines = this.add
        .text(padding + 260, rowY, linesStr, valueStyle)
        .setOrigin(0, 0);
      const vDate = this.add
        .text(padding + 380, rowY, dateStr, valueStyle)
        .setOrigin(0, 0);

      for (const t of [vTime, vLines, vDate]) {
        t.setAlpha(0.9);
        t.setStroke("#000000", 6);
      }
      section.add([vTime, vLines, vDate]);
      section.setSize(sectionWidth, sectionHeight);

      rowY += 26;
      bg.setSize(sectionWidth, rowY + 26);
    });

    return section;
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

  private formatDate(iso: string): string {
    return iso?.slice(0, 10) ?? "-";
  }
}
