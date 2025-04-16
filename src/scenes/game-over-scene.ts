import { BaseScene } from "./base-scene";

export class GameOverScene extends BaseScene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "GameOverScene",
  };

  constructor() {
    super(GameOverScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: unknown) {}

  public preload() {
    // Load scene assets here.
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: unknown) {
    this._main = this.cameras.main;
    this._viewPortHalfHeight = this._main.height / 2;
    this._viewPortHalfWidth = this._main.width / 2;
    this._viewPortHeight = this._main.height;
    this._viewPortWidth = this._main.width;

    this.add
      .text(this._viewPortHalfWidth, this._viewPortHalfHeight, "Game Over", {
        fontSize: "32px",
        color: "#fff",
      })
      .setOrigin(0.5, 0.5);

    const restartButton = this.add
      .text(this._viewPortHalfWidth, this._viewPortHalfHeight + 50, "Restart", {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.start("GameScene");
      });

    restartButton.on("pointerover", () => {
      restartButton.setStyle({ color: "#ff0" });
    });

    restartButton.on("pointerout", () => {
      restartButton.setStyle({ color: "#fff" });
    });

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-ENTER", () => {
        this.scene.start("GameScene");
      });
    }
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    // Update the game logic here.
  }
}
