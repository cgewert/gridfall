import * as PHASER from "phaser";

export class Scene extends PHASER.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "scene",
  };

  private gameOver: boolean = false;

  constructor() {
    super(Scene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: any) {}

  public preload() {
    // Load scene assets here.
  }

  /*
   * Create your game objects here.
   * @param data - Custom data provided to the scene.
   */
  public create(data: any) {
    // Create game objects here.
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
