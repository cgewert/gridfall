import { ClearCallout } from "./ClearCallout";

/* Visual representation of a Perfect Clear. */
export class PcCallout extends ClearCallout {
  // private text!: Phaser.GameObjects.Text;
  // private static readonly CALLOUT_TEXT = "[Perfect Clear]";

  constructor(scene: Phaser.Scene, private pcImage: Phaser.GameObjects.Image) {
    super(scene);
  }

  protected override init(): void {
    // this.text = this.scene.add
    //   .text(0, 0, PcCallout.CALLOUT_TEXT, {
    //     fontFamily: "Orbitron",
    //     fontSize: "64px",
    //     color: "#CCCC00",
    //     stroke: "#000000",
    //     strokeThickness: 6,
    //   })
    //   .setVisible(false);
    // this.text
    //   .setPosition(
    //     this.scene.scale.width / 2 - this.text.width / 2,
    //     this.scene.scale.height / 4 - this.text.height / 2
    //   )
    //   .setDepth(1000);
  }

  public override show() {
    if (!this.pcImage) {
      console.warn("Could not show PC Callout, image was not initialized");
      return;
    }

    this.pcImage.setVisible(true);
    this.pcImage
      .setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2)
      .setDepth(1000)
      .setScale(0.33)
      .setAlpha(0.7);
    this.scene.tweens.add({
      targets: this.pcImage,
      alpha: { from: 0, to: 1 },
      duration: 800,
      hold: 500,
      yoyo: true,
      onComplete: () => {
        this.pcImage.setVisible(false);
        this.pcImage.setAlpha(0);
      },
    });
  }
}
