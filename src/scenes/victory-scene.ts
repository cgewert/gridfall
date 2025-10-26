import Phaser from "phaser";
import { addSceneBackground } from "../effects/effects";
import { DEFAULT_MENU_FONT } from "../fonts";
import { GameMode, GameModeToString } from "../game";

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  create(data: { gameMode: GameMode; score: number; time: string }) {
    const { gameMode, score, time } = data;
    this.cameras.main.setBackgroundColor("#000000");
    addSceneBackground(this);

    const victoryText = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 100, "Victory!", {
        fontSize: "64px",
        fontFamily: DEFAULT_MENU_FONT,
        color: "#ff66cc",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const detailText = this.add
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

    // "Press Enter to Return to Menu"
    const continueText = this.add
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

    // Enter-Handler
    if (this.input.keyboard) {
      this.input.keyboard.once("keydown-ENTER", () => {
        this.scene.start("MainMenuScene");
      });
    }
  }
}
