import Phaser from "phaser";
import { addSceneBackground } from "../effects/effects";
import { DEFAULT_MENU_FONT } from "../fonts";
import { FormatScore, FormatTime, GameMode, GameModeToString } from "../game";
import { HighscoreService } from "../services/HighScoreService";
import { AnimatableText, AnimatableTextTweenType } from "../ui/AnimatableText";

export type VictorySceneData = {
  gameMode: GameMode;
  score: number;
  time: number;
  linesCleared: number;
};

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  create(data: VictorySceneData): void {
    const { gameMode, score, time, linesCleared } = data;
    this.cameras.main.setBackgroundColor("#000000");
    addSceneBackground(this);

    const victoryTitle = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 100, "Victory!", {
        fontSize: "64px",
        fontFamily: DEFAULT_MENU_FONT,
        color: "#ff66cc",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const formattedTime = FormatTime(time);
    const victoryInfo = this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        `${GameModeToString(gameMode)} Completed!\nScore: ${FormatScore(
          score
        )}\nTime: ${formattedTime}\nLines Cleared: ${linesCleared}`,
        {
          fontSize: "32px",
          fontFamily: "Arial",
          color: "#6666ff",
        }
      )
      .setOrigin(0.5);
    Phaser.Display.Align.To.BottomCenter(victoryInfo, victoryTitle, 0, 20);

    this.add
      .text(
        this.scale.width / 2,
        this.scale.height - 50,
        "Press Enter to Return to Main Menu",
        {
          fontSize: "20px",
          fontFamily: DEFAULT_MENU_FONT,
          color: "#999999",
        }
      )
      .setOrigin(0.5);

    if (this.input.keyboard) {
      this.input.keyboard.once("keydown-ENTER", () => {
        this.scene.start("MainMenuScene");
      });
    }

    if (this.checkHighScore(data)) {
      const newHighScoreText = new AnimatableText(this, {
        x: this.scale.width / 2,
        y: this.scale.height / 2 + 100,
        text: "New High Score!",
        fontSize: 32,
        fontFamily: DEFAULT_MENU_FONT,
        color: "#ffcc00",
        depth: 10,
        align: "center",
      });
      newHighScoreText.startAnimation(AnimatableTextTweenType.PULSE);

      Phaser.Display.Align.To.BottomCenter(
        newHighScoreText,
        victoryInfo,
        0,
        50
      );
    }
  }

  /**
   * Save to local storage if the current score is a high score.
   */
  private checkHighScore(data: VictorySceneData): boolean {
    const { gameMode, linesCleared, score, time } = data;

    switch (data.gameMode) {
      case GameMode.ASCENT:
        // highScore = HighscoreService.AscentHighScore;
        // if (
        //   currentScore > highScore.score ||
        //   TimeStringToMilliseconds(currentTime) < highScore.time
        // ) {
        //   HighscoreService.AscentHighScore = {
        //     score: currentScore,
        //     time: TimeStringToMilliseconds(currentTime),
        //   };
        //   return true;
        // }
        break;
      case GameMode.RUSH:
        let isHighScore = HighscoreService.submitRush({
          timeMs: time,
          linesCleared,
          achievedAt: new Date().toISOString(),
        });
        if (isHighScore.isNewBest) {
          return true;
        }
        break;
      case GameMode.INFINITY:
        // highScore = HighscoreService.InfinityHighScore;
        // if (
        //   currentScore > highScore.score ||
        //   TimeStringToMilliseconds(currentTime) < highScore.time
        // ) {
        //   HighscoreService.InfinityHighScore = {
        //     score: currentScore,
        //     time: TimeStringToMilliseconds(currentTime),
        //   };
        //   return true;
        // }
        break;
      default:
        return false;
    }
    return false;
  }
}
