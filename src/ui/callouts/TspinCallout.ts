import { GameScene } from "../../scenes/game-scene";
import { ClearCallout } from "./ClearCallout";

/*
 *  Visual representation of a T-Spin.
 */
export class TspinCallout extends ClearCallout {
  constructor(
    scene: Phaser.Scene,
    private singleImage: Phaser.GameObjects.Image,
    private doubleImage: Phaser.GameObjects.Image,
    private tripleImage: Phaser.GameObjects.Image
  ) {
    super(scene);
  }

  protected override init(): void {}

  public override show(cleared: number) {
    let target;

    switch (cleared) {
      case 1:
        target = this.singleImage;
        break;
      case 2:
        target = this.doubleImage;
        break;
      case 3:
        target = this.tripleImage;
        break;
      default:
        break;
    }

    if (!target) {
      console.warn("Could not show T-Spin callout! No valid target image.");
      return;
    }

    target.setVisible(true).setDepth(1000).setScale(0.33);
    this.scene.tweens.add({
      targets: target,
      alpha: { from: 0, to: 1 },
      duration: 800,
      hold: 500,
      yoyo: true,
    });
  }
}
