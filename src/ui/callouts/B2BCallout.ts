import { GameScene } from "../../scenes/game-scene";
import { ClearCallout } from "./ClearCallout";

export class B2BCallout extends ClearCallout {
  private text!: Phaser.GameObjects.Text;
  private static readonly CALLOUT_TEXT = "[Back to Back]";

  constructor(scene: Phaser.Scene) {
    super(scene);
  }

  protected override init(): void {
    this.text = this.scene.add
      .text(0, 0, B2BCallout.CALLOUT_TEXT, {
        fontFamily: "Orbitron",
        fontSize: "36px",
        color: "#d822cc",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setVisible(false);

    // Position the text to the bottom left of the game scenes grid
    this.text
      .setPosition(
        this.scene.scale.width / 2 -
          this.text.width / 2 -
          GameScene.totalGridWidth,
        this.scene.scale.height / 2 -
          this.text.height +
          GameScene.totalGridHeight / 2
      )
      .setDepth(1000);
  }

  public override show() {
    this.text.setVisible(true);
    this.scene.tweens.add({
      targets: this.text,
      alpha: { from: 0, to: 1 },
      duration: 800,
      hold: 500,
      yoyo: true,
      onComplete: () => {
        this.text.setVisible(false);
        this.text.setAlpha(0);
      },
    });
  }
}
