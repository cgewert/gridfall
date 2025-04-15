import { BaseScene } from "./base-scene";
import * as Phaser from "phaser";

export class MainMenuScene extends BaseScene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "MainMenuScene",
  };

  private menuText!: Phaser.GameObjects.Text;
  private newGameText!: Phaser.GameObjects.Text;

  constructor() {
    super(MainMenuScene.CONFIG);
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

    this.addMenuTitle();
    this.addNewGameOption();
    this.setupInput();
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    // Update the game logic here.
  }

  private addMenuTitle(): void {
    this.menuText = this.add
      .text(
        this._viewPortHalfWidth,
        this._viewPortHalfHeight - 100,
        "MAIN MENU",
        {
          fontFamily: "Arial",
          fontSize: "48px",
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);
  }

  private addNewGameOption(): void {
    this.newGameText = this.add
      .text(this._viewPortHalfWidth, this._viewPortHalfHeight, "> NEW GAME", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#00ff00",
      })
      .setOrigin(0.5);
  }

  private setupInput(): void {
    if (this.input?.keyboard) {
      this.input.keyboard.once("keydown-ENTER", () => {
        // this.music.stop(); // Musik beenden
        this.scene.start("GameScene");
      });
    } else {
      throw new Error("Keyboard input not available.");
    }
  }
}
