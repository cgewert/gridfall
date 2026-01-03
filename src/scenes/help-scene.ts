import Phaser from "phaser";
import i18next from "i18next";

export class HelpScene extends Phaser.Scene {
  public static readonly KEY = "HelpScene";

  constructor() {
    super(HelpScene.KEY);
  }

  private getRotateLeftLabel(): string {
    const lang = (i18next.language || "en").toLowerCase();

    // de: QWERTZ → Y
    if (lang.startsWith("de")) return "Y";

    // fr: AZERTY → W
    if (lang.startsWith("fr")) return "W";

    // ja: JIS QWERTY based → Z
    // en + default → Z
    return "Z";
  }

  public create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);

    const title = i18next.t("labels.mnu-help");
    this.add
      .text(width / 2, height * 0.12, title, {
        fontFamily: "Orbitron",
        fontSize: "40px",
      })
      .setOrigin(0.5);

    const lines: Array<[string, string]> = [
      [i18next.t("controls.moveLeft"), "←"],
      [i18next.t("controls.moveRight"), "→"],
      [i18next.t("controls.softDrop"), "↓"],
      [i18next.t("controls.hardDrop"), "↑"],
      [i18next.t("controls.rotateCounterClockwise"), this.getRotateLeftLabel()],
      [i18next.t("controls.rotateClockwise"), "X"],
      [i18next.t("controls.hold"), "SPACE"],
      [i18next.t("controls.pause"), "P"],
      [i18next.t("controls.restartRound"), "R"],
      [i18next.t("controls.back"), "ESC"],
    ];

    const startY = height * 0.22;
    const rowH = 34;
    const leftX = width * 0.3;
    const rightX = width * 0.7;

    lines.forEach(([action, key], i) => {
      const y = startY + i * rowH;

      this.add
        .text(leftX, y, action, {
          fontFamily: "Orbitron",
          fontSize: "22px",
        })
        .setOrigin(0, 0.5);

      this.add
        .text(rightX, y, key, {
          fontFamily: "Orbitron",
          fontSize: "22px",
        })
        .setOrigin(1, 0.5);
    });

    const hint = "ESC: " + i18next.t("labels.back");
    this.add
      .text(width / 2, height * 0.9, hint, {
        fontFamily: "Orbitron",
        fontSize: "18px",
      })
      .setOrigin(0.5);

    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.start("MainMenuScene");
    });

    // TODO: If pointer controls are added, re-enable this.
    // this.input.once("pointerdown", () => {
    //   this.scene.start("MainMenuScene");
    // });
  }
}
