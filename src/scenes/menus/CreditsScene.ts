import Phaser from "phaser";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";

export class CreditsScene extends BaseMenuScene {
  public static readonly KEY = "CreditsScene";

  constructor() {
    super(CreditsScene.KEY, "Credits");
  }

  // TODO: Use phaser container alignment instead of manual positioning, delay text creation until after modal is created
  create(data: { parentKey?: string } = {}) {
    super.create(data);
    this.add.text(this.modal.x - 150, 400, "GRIDFALL v1.0.0", {
      fontSize: "32px",
      color: "#fff",
    });

    this.add.text(this.modal.x - 150, 500, "Developed by dexter_coding", {
      fontSize: "24px",
      color: "#fff",
    });

    this.add.text(this.modal.x - 150, 560, "Pastel Tetriminos by Aqua", {
      fontSize: "24px",
      color: "#fff",
    });
  }

  public update() {}
}
