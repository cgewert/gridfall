import Phaser from "phaser";

export class ConnectingIndicator extends Phaser.GameObjects.Container {
  private text: Phaser.GameObjects.Text;
  private dots = 0;
  private timer?: Phaser.Time.TimerEvent;
  private spinner: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, label = "Connecting") {
    super(scene, x, y);

    this.text = scene.add
      .text(0, 0, label, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Simple spinner (arc rotating)
    this.spinner = scene.add
      .arc(0, -45, 18, 30, 300, false, 0xffffff, 0.25)
      .setStrokeStyle(4, 0xffffff, 1);

    this.add([this.spinner, this.text]);

    scene.add.existing(this);

    this.timer = scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        this.dots = (this.dots + 1) % 4;
        this.text.setText(`${label}${".".repeat(this.dots)}`);
        this.spinner.rotation += 0.35;
      },
    });
  }

  setLabel(label: string) {
    this.text.setText(label);
  }

  destroy(fromScene?: boolean) {
    this.timer?.remove(false);
    super.destroy(fromScene);
  }
}
