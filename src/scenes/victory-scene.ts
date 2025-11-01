import Phaser from "phaser";
import { addSceneBackground } from "../effects/effects";
import { DEFAULT_MENU_FONT } from "../fonts";
import { GameMode, GameModeToString, TimeStringToMilliseconds } from "../game";
import { HighScoreSettings } from "../services/HighScoreSettings";

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  create(data: { gameMode: GameMode; score: number; time: string }) {
    const { gameMode, score, time } = data;
    this.cameras.main.setBackgroundColor("#000000");
    addSceneBackground(this);

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 100, "Victory!", {
        fontSize: "64px",
        fontFamily: DEFAULT_MENU_FONT,
        color: "#ff66cc",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        `${GameModeToString(
          gameMode
        )} Completed!\nScore: ${score}\nTime: ${time}`,
        {
          fontSize: "32px",
          fontFamily: "Arial",
          color: "#6666ff",
        }
      )
      .setOrigin(0.5);

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
      this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2 + 100,
          "New High Score!",
          {
            fontSize: "32px",
            fontFamily: DEFAULT_MENU_FONT,
            color: "#ffcc00",
          }
        )
        .setOrigin(0.5);
    }
  }

  /**
   * Save to local storage if the current score is a high score.
   */
  private checkHighScore(data: {
    gameMode: GameMode;
    score: number;
    time: string;
  }): boolean {
    const currentScore = data.score;
    const currentTime = data.time;
    let highScore = { score: 0, time: 0 };

    switch (data.gameMode) {
      case GameMode.ASCENT:
        highScore = HighScoreSettings.AscentHighScore;
        if (
          currentScore > highScore.score ||
          TimeStringToMilliseconds(currentTime) < highScore.time
        ) {
          HighScoreSettings.AscentHighScore = {
            score: currentScore,
            time: TimeStringToMilliseconds(currentTime),
          };
          return true;
        }
        break;
      case GameMode.RUSH:
        highScore = HighScoreSettings.RushHighScore;
        if (
          currentScore > highScore.score ||
          TimeStringToMilliseconds(currentTime) < highScore.time
        ) {
          HighScoreSettings.RushHighScore = {
            score: currentScore,
            time: TimeStringToMilliseconds(currentTime),
          };
          return true;
        }
        break;
      case GameMode.INFINITY:
        highScore = HighScoreSettings.InfinityHighScore;
        if (
          currentScore > highScore.score ||
          TimeStringToMilliseconds(currentTime) < highScore.time
        ) {
          HighScoreSettings.InfinityHighScore = {
            score: currentScore,
            time: TimeStringToMilliseconds(currentTime),
          };
          return true;
        }
        break;
      default:
        return false;
    }
    return false;
  }
}
