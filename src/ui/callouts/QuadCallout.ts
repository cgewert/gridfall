import { ClearCallout } from "./ClearCallout";

export class QuadCallout extends ClearCallout {
  // private text!: Phaser.GameObjects.Text;
  // private static readonly CALLOUT_TEXT = "[Quad]";

  constructor(
    scene: Phaser.Scene,
    private quadImage: Phaser.GameObjects.Image
  ) {
    super(scene);
  }

  protected override init(): void {
    // this.text = this.scene.add
    //   .text(0, 0, QuadCallout.CALLOUT_TEXT, {
    //     fontFamily: "Orbitron",
    //     fontSize: "64px",
    //     color: "#FF0000",
    //   stroke: "#000000",
    //   strokeThickness: 6,
    // })
    // .setVisible(false);
    // this.text
    //   .setPosition(
    //     this.scene.scale.width / 2 - this.text.width / 2,
    //     this.scene.scale.height / 4 - this.text.height / 2
    //   )
    //   .setDepth(1000);
  }

  public override show() {
    if (!this.quadImage) return;

    this.quadImage.setVisible(true);
    this.quadImage
      .setPosition(this.scene.scale.width / 2, this.scene.scale.height / 4)
      .setDepth(1000)
      .setScale(0.33)
      .setAlpha(0.75);
    this.scene.tweens.add({
      targets: this.quadImage,
      alpha: { from: 0, to: 1 },
      duration: 800,
      hold: 500,
      yoyo: true,
      onComplete: () => {
        this.quadImage.setVisible(false);
        this.quadImage.setAlpha(0);
      },
    });
  }
}
