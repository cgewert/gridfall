// src/ui/ClearCallout.ts
export class ClearCallout {
  constructor(private scene: Phaser.Scene) {}

  public show(text: string) {
    const t = this.scene.add
      .text(this.scene.scale.width / 2, this.scene.scale.height / 3, text, {
        fontFamily: "Orbitron",
        fontSize: "48px",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(9998);

    this.scene.tweens.add({
      targets: t,
      alpha: 1,
      duration: 120,
      ease: "Sine.easeOut",
      yoyo: true,
      hold: 700,
      onComplete: () => t.destroy(),
    });
  }
}
