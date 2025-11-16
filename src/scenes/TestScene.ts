import Phaser from "phaser";

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: "TestScene" });
  }

  create(): void {
    // Fullscreen black background
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000)
      .setOrigin(0, 0);
  }
}
