import Phaser from "phaser";
import { BaseMenuScene } from "../../ui/menu/BaseMenu";

export class CreditsScene extends BaseMenuScene {
  public static readonly KEY = "CreditsScene";

  constructor() {
    super(CreditsScene.KEY, "Credits");
  }

  create(data: { parentKey?: string } = {}) {
    super.create(data);
    this.add.text(this.modal.x - 150, 350, "GRIDFALL v1.0.0", {
      fontSize: "26px",
      color: "#fff",
      fontFamily: "Orbitron, sans-serif",
    });

    this.add.text(this.modal.x - 150, 400, "Developed by dexter_coding", {
      fontSize: "18px",
      color: "#fff",
      fontFamily: "Orbitron, sans-serif",
    });

    this.add.text(this.modal.x - 150, 450, "Pastel/Neon Tetriminos by Aqua", {
      fontSize: "18px",
      color: "#fff",
      fontFamily: "Orbitron, sans-serif",
    });

    this.add.text(this.modal.x - 150, 490, "Testers: Overcast", {
      fontSize: "18px",
      color: "#fff",
      fontFamily: "Orbitron, sans-serif",
    });
  }

  public update() {}
}
