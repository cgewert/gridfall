import Phaser from "phaser";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";
import { t } from "i18next";
import pkg from "./../../../package.json";

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
    const versionText = this.add.text(
      this.modal.x - 150,
      350,
      `GRIDFALL v${pkg.version}`,
      {
        fontSize: "26px",
        color: "#fff",
        fontFamily: "Orbitron, sans-serif",
      }
    );
    const authorText = this.add.text(
      0,
      400,
      `${t("credits.programming")} ${pkg.author}`,
      {
        fontSize: "18px",
        color: "#fff",
        fontFamily: "Orbitron, sans-serif",
      }
    );
    const tetriminoArtText = this.add.text(
      this.modal.x - 150,
      450,
      `${t("credits.tetrimino-art")} Aqua`,
      {
        fontSize: "18px",
        color: "#fff",
        fontFamily: "Orbitron, sans-serif",
      }
    );
    const testingAndFeedbackText = this.add.text(
      this.modal.x - 150,
      490,
      `${t("credits.testingAndFeedback")} Overcast`,
      {
        fontSize: "18px",
        color: "#fff",
        fontFamily: "Orbitron, sans-serif",
      }
    );

    this.texts.push(versionText);
    this.texts.push(authorText);
    this.texts.push(tetriminoArtText);
    this.texts.push(testingAndFeedbackText);
    Phaser.Display.Align.In.TopCenter(versionText, this.modal, 0, 70);
    Phaser.Display.Align.To.BottomCenter(authorText, versionText, 0, 20);
    Phaser.Display.Align.To.BottomCenter(tetriminoArtText, authorText, 0, 20);
    Phaser.Display.Align.To.BottomCenter(
      testingAndFeedbackText,
      tetriminoArtText,
      0,
      20
    );
  }

  protected beforeClose(): void {
    this.texts.forEach((text) => text.destroy());
  }

  public update() {}
}
