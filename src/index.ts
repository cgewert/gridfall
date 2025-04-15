import * as PHASER from "phaser";
import { TitleScene } from "./scenes/title-scene";
import { MainMenuScene } from "./scenes/main-menu-scene";
import { GameScene } from "./scenes/game-scene";

export class Game extends PHASER.Game {
  public static readonly GAME_NAME = "GRIDFALL";
  public static readonly GAME_VERSION = "0.0.1";
  public static readonly GAME_AUTHOR = "cgewert@gmail.com";

  private static GAME_CONFIG: Phaser.Types.Core.GameConfig = {
    title: Game.GAME_NAME,
    type: PHASER.AUTO,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1600,
      height: 900,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0, x: 0 },
      },
    },
    backgroundColor: "#000000",
    scene: [TitleScene, MainMenuScene, GameScene],
    audio: {
      disableWebAudio: false,
    },
  };

  constructor() {
    super(Game.GAME_CONFIG);
  }
}

const game = new Game();
