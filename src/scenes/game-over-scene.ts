import { addSceneBackground } from "../effects/effects";
import { DEFAULT_MENU_FONT } from "../fonts";
import { GameMode } from "../game";
import { BlockSkin } from "../shapes";
import { SpawnSystem } from "../spawn";
import { GameSceneConfiguration } from "./game-scene";

export class GameOverScene extends Phaser.Scene {
  private _main: Phaser.Cameras.Scene2D.Camera | null = null;
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "GameOverScene",
  };
  private selectedIndex: number = 0;
  private options: Phaser.GameObjects.Text[] = [];
  private currentSpawn!: SpawnSystem;
  private blockSkin!: BlockSkin;
  private gameMode!: GameMode;

  constructor() {
    super(GameOverScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: GameSceneConfiguration) {
    console.debug("Initializing GameOverScene with data:", data);
    this.options = [];
    this.selectedIndex = 0;
    this.currentSpawn = data.spawnSystem;
    this.blockSkin = data.blockSkin;
    this.gameMode = data.gameMode;
  }

  public preload() {
    // Load scene assets here.
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: GameSceneConfiguration) {
    this._main = this.cameras.main;
    this.currentSpawn = data.spawnSystem;
    this.blockSkin = data.blockSkin;
    this.gameMode = data.gameMode;
    addSceneBackground(this);
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Game Over", {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "32px",
        color: "#fff",
      })
      .setOrigin(0.5, 0.5);

    const entries = ["▶ Restart Round", "Exit to Menu"];
    entries.forEach((label, i) => {
      const text = this.add
        .text(
          this.scale.width / 2,
          this.scale.height / 2 + 50 + i * 40,
          label,
          {
            fontFamily: DEFAULT_MENU_FONT,
            fontSize: "24px",
            color: "#aaaaaa",
          }
        )
        .setOrigin(0.5);
      this.options.push(text);
    });

    this.updateMenuHighlight();

    this.input.keyboard?.on("keydown-UP", () => {
      this.selectedIndex =
        (this.selectedIndex + this.options.length - 1) % this.options.length;
      this.updateMenuHighlight();
    });

    this.input.keyboard?.on("keydown-DOWN", () => {
      this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
      this.updateMenuHighlight();
    });

    this.input.keyboard?.on("keydown-ENTER", () => {
      if (this.selectedIndex === 0) {
        this.scene.start("GameScene", {
          spawnSystem: this.currentSpawn,
          blockSkin: this.blockSkin,
          gameMode: this.gameMode,
        } as GameSceneConfiguration);
      } else {
        this.scene.start("MainMenuScene", {
          spawnSystem: this.currentSpawn,
          blockSkin: this.blockSkin,
          gameMode: this.gameMode,
        } as GameSceneConfiguration);
      }
    });
  }

  private updateMenuHighlight() {
    this.options.forEach((text, index) => {
      const active = index === this.selectedIndex;
      text.setText(
        active
          ? `▶ ${text.text.replace(/^▶ /, "")}`
          : text.text.replace(/^▶ /, "")
      );
      text.setColor(active ? "#ffffff" : "#aaaaaa");
      text.setScale(active ? 1.2 : 1.0);
    });
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
