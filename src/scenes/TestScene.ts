import Phaser from "phaser";
import { NextPreview } from "../ui/NextPreview";
import { GameScene } from "./game-scene";

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: "TestScene" });
  }

  create(): void {
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
      .setOrigin(0, 0);

    const box = new NextPreview(this, 250, 250, {
      borderThickness: 25,
      width: GameScene.BLOCKSIZE * 4,
      height: GameScene.BLOCKSIZE * 10,
      fillColor: 0x000000,
      borderColor: 0xffffff,
    });

    this.add.existing(box);
  }
}
