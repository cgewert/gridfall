import { BaseScene } from "./base-scene";

export class GameScene extends BaseScene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "GameScene",
  };

  private gameOver: boolean = false;

  constructor() {
    super(GameScene.CONFIG);
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
