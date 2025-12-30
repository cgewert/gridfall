import * as PHASER from "phaser";
import { TitleScene } from "./scenes/title-scene";
import { MainMenuScene } from "./scenes/main-menu-scene";
import { GameScene } from "./scenes/game-scene";
import { GameOverScene } from "./scenes/game-over-scene";
import { VictoryScene } from "./scenes/victory-scene";
import en from "./locales/en/translation.json";
import de from "./locales/de/translation.json";
import ja from "./locales/ja/translation.json";
import fr from "./locales/fr/translation.json";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { AudioMenuScene } from "./scenes/menus/AudioMenuScene";
import { CreditsScene } from "./scenes/menus/CreditsScene";
import { OptionsScene } from "./scenes/menus/OptionsScene";
import { GeneralMenuScene } from "./scenes/menus/GeneralMenuScene";
import { LanguageSettings } from "./services/LanguageSettings";
import { InputSettings } from "./services/InputSettings";
import { ControlsMenuScene } from "./scenes/menus/ControlsMenuScene";
import { SkinSettings } from "./services/SkinSettings";
import { SpawnSettings } from "./services/SpawnSettings";
import { HighscoreService } from "./services/HighScoreService";
import { HighscoreScene } from "./scenes/high-score-scene";
import { TestScene } from "./scenes/TestScene";

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
    scene: [
      //TestScene,
      TitleScene,
      MainMenuScene,
      GameScene,
      GameOverScene,
      VictoryScene,
      AudioMenuScene,
      GeneralMenuScene,
      CreditsScene,
      OptionsScene,
      ControlsMenuScene,
      HighscoreScene,
    ],
    audio: {
      disableWebAudio: false,
    },
  };

  constructor() {
    super(Game.GAME_CONFIG);
  }
}

i18next.use(LanguageDetector).init({
  supportedLngs: ["de", "en", "fr", "ja"],
  debug: true,
  resources: {
    en: {
      translation: en,
    },
    fr: {
      translation: fr,
    },
    de: {
      translation: de,
    },
    ja: {
      translation: ja,
    },
  },
  lng: "de",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Initialize all game services and load persistet settings.
LanguageSettings.load();
const game = new Game();
LanguageSettings.init(game);
LanguageSettings.set(LanguageSettings.get());
InputSettings.init(game);
InputSettings.load();
SkinSettings.load();
SkinSettings.init(game);
SpawnSettings.load();
SpawnSettings.init(game);
HighscoreService.load();
