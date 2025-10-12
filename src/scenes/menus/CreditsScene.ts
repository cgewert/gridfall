import Phaser from "phaser";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { t } from "i18next";

export class CreditsScene extends BaseMenuScene {
  public static readonly KEY = "CreditsScene";
  public static readonly HINT = "hints.mnu-credits";
  private texts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(CreditsScene.KEY, "labels.mnu-credits", CreditsScene.HINT);
  }

  create(data: { parentKey?: string } = {}) {
    super.create(data);
  }

  protected onEntranceCompleted(): void {
    this.texts.push(
      this.add.text(this.modal.x - 150, 350, "GRIDFALL v1.0.0", {
        fontSize: "26px",
        color: "#fff",
        fontFamily: "Orbitron, sans-serif",
      })
    );

    this.texts.push(
      this.add.text(
        this.modal.x - 150,
        400,
        `${t("credits.programming")} dexter_coding`,
        {
          fontSize: "18px",
          color: "#fff",
          fontFamily: "Orbitron, sans-serif",
        }
      )
    );

    this.texts.push(
      this.add.text(
        this.modal.x - 150,
        450,
        `${t("credits.tetrimino-art")} Aqua`,
        {
          fontSize: "18px",
          color: "#fff",
          fontFamily: "Orbitron, sans-serif",
        }
      )
    );

    this.texts.push(
      this.add.text(
        this.modal.x - 150,
        490,
        `${t("credits.testingAndFeedback")} Overcast`,
        {
          fontSize: "18px",
          color: "#fff",
          fontFamily: "Orbitron, sans-serif",
        }
      )
    );
  }

  protected beforeClose(): void {
    this.texts.forEach((text) => text.destroy());
  }

  public update() {}
}
