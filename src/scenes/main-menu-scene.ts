import * as Phaser from "phaser";
import { GameMode, GameSceneConfiguration } from "./game-scene";
import { BlockSkin } from "../shapes";
import { SpawnSystem } from "../spawn";
import { addSceneBackground } from "../effects/effects";
import { DEFAULT_FONT_STYLE } from "../fonts";

enum MenuEntry {
  MARATHON,
  SPRINT,
  ENDLESS,
  SPAWN_SYSTEM,
  BLOCK_SKIN,
}

export class MainMenuScene extends Phaser.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "MainMenuScene",
  };

  private _main: Phaser.Cameras.Scene2D.Camera | null = null;

  private selectedEntry = MenuEntry.ENDLESS;
  private currentSpawn = SpawnSystem.SEVEN_BAG;
  private blockSkin: BlockSkin = BlockSkin.MINOS2;
  private gameMode: GameMode = GameMode.ENDLESS;
  private blockpreview!: Phaser.GameObjects.Sprite;
  private menuTexts: Phaser.GameObjects.Text[] = [];

  private menuText!: Phaser.GameObjects.Text;
  private newGameText!: Phaser.GameObjects.Text;

  constructor() {
    super(MainMenuScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: GameSceneConfiguration) {
    this.menuTexts = [];
    this.selectedEntry = (data?.gameMode as number) ?? MenuEntry.ENDLESS;
    this.currentSpawn = data?.spawnSystem ?? SpawnSystem.SEVEN_BAG;
    this.gameMode = data?.gameMode ?? GameMode.ENDLESS;
    this.blockSkin = data?.blockSkin ?? BlockSkin.MINOS2;
  }

  public preload() {
    this.load.spritesheet("minos1", "assets/gfx/spritesheets/minos-1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet(
      "minosPastel",
      "assets/gfx/spritesheets/minos-pastel.png",
      {
        frameWidth: 120,
        frameHeight: 120,
      }
    );

    this.load.spritesheet("minos2", "assets/gfx/spritesheets/minos-2.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("minos3", "assets/gfx/spritesheets/minos-3.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.spritesheet("minos4", "assets/gfx/spritesheets/minos-4.png", {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: unknown) {
    this._main = this.cameras.main;
    addSceneBackground(this);

    const menu_entries = [
      () => `Marathon`,
      () => `Sprint`,
      () => `Endless`,
      () =>
        `Spawn System: ${
          this.currentSpawn === SpawnSystem.SEVEN_BAG ? "7-Bag" : "Random"
        }`,
      () => `Blocks: ${this.blockSkin}`,
    ];
    const baseY = 300;
    menu_entries.forEach((_entryFn, i) => {
      const text = this.add
        .text(this.scale.width / 2, baseY + i * 50, "", DEFAULT_FONT_STYLE)
        .setOrigin(0.5);
      this.menuTexts.push(text);
      // Draw block skin
      if (i === MenuEntry.BLOCK_SKIN) {
        const skin = this.blockSkin;
        this.blockpreview = this.add
          .sprite(this.scale.width / 2 + 225, baseY + i * 50, skin, 1)
          .setOrigin(0.5)
          .setScale(0.5);
      }
    });

    this.updateMenu(menu_entries);
    this.setupInput(menu_entries);
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    // Update the game logic here.
  }

  private updateMenu(menuEntries: (() => string)[]): void {
    this.menuTexts.forEach((text, i) => {
      const active = i === this.selectedEntry;
      text.setText(active ? "▶ " + menuEntries[i]() : menuEntries[i]());
      text.setStyle({
        color: active ? "#ffffff" : "#aaaaaa",
        fontStyle: active ? "bold" : "normal",
      });
      text.setScale(active ? 1.2 : 1.0);
    });
  }

  private addMenuTitle(): void {
    this.menuText = this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 100, "MAIN MENU", {
        fontFamily: "Arial",
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }

  private addNewGameOption(): void {
    this.newGameText = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "> NEW GAME", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#00ff00",
      })
      .setOrigin(0.5);
  }

  private setupInput(menuEntries: (() => string)[]): void {
    if (this.input?.keyboard) {
      this.input.keyboard.on("keydown-UP", () => {
        this.selectedEntry =
          (this.selectedEntry + menuEntries.length - 1) % menuEntries.length;
        this.updateMenu(menuEntries);
      });

      this.input.keyboard.on("keydown-DOWN", () => {
        this.selectedEntry = (this.selectedEntry + 1) % menuEntries.length;
        this.updateMenu(menuEntries);
      });

      this.input.keyboard.on("keydown-ENTER", () => {
        if (this.selectedEntry === MenuEntry.MARATHON) {
          const config = {
            spawnSystem: this.currentSpawn,
            blockSkin: this.blockSkin,
            gameMode: GameMode.MARATHON,
          };
          this.scene.start("GameScene", config);
        } else if (this.selectedEntry === MenuEntry.SPRINT) {
          const config = {
            spawnSystem: this.currentSpawn,
            blockSkin: this.blockSkin,
            gameMode: GameMode.SPRINT,
          };
          this.scene.start("GameScene", config);
        } else if (this.selectedEntry === MenuEntry.ENDLESS) {
          const config = {
            spawnSystem: this.currentSpawn,
            blockSkin: this.blockSkin,
            gameMode: GameMode.ENDLESS,
          };
          this.scene.start("GameScene", config);
        } else if (this.selectedEntry === MenuEntry.SPAWN_SYSTEM) {
          const isNowRandom = this.currentSpawn === SpawnSystem.SEVEN_BAG;
          this.currentSpawn = isNowRandom
            ? SpawnSystem.RANDOM
            : SpawnSystem.SEVEN_BAG;
          this.updateMenu(menuEntries);
        } else if (this.selectedEntry === MenuEntry.BLOCK_SKIN) {
          const skins = Object.values(BlockSkin);
          this.blockSkin =
            skins[(skins.indexOf(this.blockSkin) + 1) % skins.length];
          this.updateMenu(menuEntries);
          this.tweens.add({
            targets: this.blockpreview,
            scale: 0.0,
            duration: 175,
            ease: "Circular.Out",
            onComplete: () => {
              this.blockpreview.setTexture(
                this.blockSkin,
                Phaser.Math.Between(0, 6)
              );
              this.tweens.add({
                targets: this.blockpreview,
                scale: 0.5,
                duration: 175,
                ease: "Circular.In",
              });
            },
          });
        }
      });
    } else {
      throw new Error("Keyboard input not available.");
    }
  }
}
