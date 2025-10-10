import * as Phaser from "phaser";
import { GameSceneConfiguration } from "./game-scene";
import { BlockSkin } from "../shapes";
import { SpawnSystem } from "../spawn";
import { addScanlines, addSceneBackground } from "../effects/effects";
import {
  AudioAnalysis,
  CreateAudioAnalysis,
  GameConfig,
  GameMode,
} from "../game";
import { MenuList } from "../ui/menu/MenuList";
import { Soundtrack } from "../audio";
import { AudioBus } from "../services/AudioBus";
import { t } from "i18next";
import { SettingsEvents } from "../services/SettingsEvents";
import { Locale } from "../services/LanguageSettings";

export class MainMenuScene extends Phaser.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "MainMenuScene",
  };

  private menuStack: string[] = [];
  private menu!: MenuList;
  private audioAnalyser: AudioAnalysis = {} as AudioAnalysis;
  private music?: Phaser.Sound.WebAudioSound;
  private currentSpawn = SpawnSystem.SEVEN_BAG;
  private blockSkin: BlockSkin = BlockSkin.MINOS2;
  private gameMode: GameMode = GameMode.INFINITY;
  private blockpreview!: Phaser.GameObjects.Sprite;

  constructor() {
    super(MainMenuScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: GameSceneConfiguration) {
    this.currentSpawn = data?.spawnSystem ?? SpawnSystem.SEVEN_BAG;
    this.gameMode = data?.gameMode ?? GameMode.ASCENT;
    this.blockSkin = data?.blockSkin ?? BlockSkin.MINOS2;
  }

  public preload() {
    this.load.spritesheet("neon", "assets/gfx/spritesheets/neon.png", {
      frameWidth: 30,
      frameHeight: 30,
    });

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

    this.load.audio("ui-move", "assets/audio/sfx/ui-move.ogg");
    this.load.audio("ui-choose", "assets/audio/sfx/ui-choose.ogg");
    this.load.audio("menuLoop", Soundtrack.menu);
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: GameSceneConfiguration) {
    const { width, height } = this.scale;

    AudioBus.AddSceneAudio(this, "ui-move");
    AudioBus.AddSceneAudio(this, "ui-choose");
    AudioBus.AddSceneAudio(this, "menuLoop", { loop: true });

    addSceneBackground(this);
    addScanlines(this, { alpha: 0.12, speedY: 1.2 });

    this.menu = new MenuList(this, {
      x: width / 2,
      y: height / 2,
      gap: 64,
      onMoveSoundKey: "ui-move",
      onChooseSoundKey: "ui-choose",
      items: [
        {
          identifier: "mnu-ascent",
          label: "Ascent",
          translatable: false,
          disabled: false,
          description: t("descriptions.mnu-ascent"),
          action: () => {
            return this.startGame({
              gameMode: GameMode.ASCENT,
              blockSkin: this.blockSkin,
              spawnSystem: this.currentSpawn,
            });
          },
        },
        {
          identifier: "mnu-infinity",
          label: "Infinity",
          translatable: false,
          disabled: false,
          description: t("descriptions.mnu-infinity"),
          action: () =>
            this.startGame({
              gameMode: GameMode.INFINITY,
              blockSkin: this.blockSkin,
              spawnSystem: this.currentSpawn,
            }),
        },
        {
          identifier: "mnu-rush",
          label: "Rush",
          translatable: false,
          disabled: false,
          description: t("descriptions.mnu-rush"),
          action: () =>
            this.startGame({
              gameMode: GameMode.RUSH,
              blockSkin: this.blockSkin,
              spawnSystem: this.currentSpawn,
            }),
        },
        {
          identifier: "mnu-credits",
          label: t("labels.mnu-credits"),
          translatable: true,
          disabled: false,
          action: () => this.openSubmenu("CreditsScene"),
        },
        {
          identifier: "mnu-options",
          label: t("labels.mnu-options"),
          translatable: true,
          disabled: false,
          action: () => this.openSubmenu("OptionsScene"),
        },
      ],
    });

    switch (this.gameMode) {
      case GameMode.ASCENT:
        this.menu.selectItem("mnu-ascent");
        break;
      case GameMode.RUSH:
        this.menu.selectItem("mnu-rush");
        break;
      case GameMode.INFINITY:
        this.menu.selectItem("mnu-infinity");
        break;
    }

    this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 12000,
      repeat: -1,
      onUpdate: (tw) => {
        const t = tw.getValue();
        this.menu.y = this.menu.y + Math.cos(t!) * 0.05;
        this.menu.x = this.menu.x + Math.sin(t!) * 0.05;
      },
    });

    if (this.sound.locked) {
      this.sound.once("unlocked", () => this.startAudio());
      this.input.once("pointerdown", () => (this.sound as any).unlock?.());
    } else {
      this.startAudio();
    }

    // Register event handlers
    this.events.on(Phaser.Scenes.Events.CREATE, () => {
      this.menu.setPosition(width / 2, 200);
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.music?.stop();
      this.audioAnalyser?.disconnect && this.audioAnalyser.disconnect();
      this.tweens.killAll();
    });

    // Handle language change events
    this.game.events.on(
      SettingsEvents.LanguageChanged,
      (e: { lang: Locale }) => {
        console.log("Language changed to ", e.lang);

        this.menu.updateText(e.lang);
      }
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.game.events.off(SettingsEvents.LanguageChanged)
    );
  }

  private startGame(config: GameConfig) {
    this.scene.start("GameScene", config);
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    // Update the game logic here.
  }

  private startAudio() {
    if (this.music && this.music.isPlaying) return; // already started
    this.music = AudioBus.PlayMusic(
      this,
      "menuLoop"
    ) as Phaser.Sound.WebAudioSound;
    this.audioAnalyser = CreateAudioAnalysis(this);

    this.startBeatLoop();
  }

  private startBeatLoop() {
    if (!this.audioAnalyser.analyser) return;
    const analyser = this.audioAnalyser.analyser;
    this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const bass = data.slice(16, 32).reduce((a, b) => a + b, 0) / (16 * 255);
        this.menu.beat(bass);
        if (bass > 0.4) {
          this.cameras.main.shake(16, 0.002 * bass);
        }
      },
    });
  }

  private openSubmenu(key: string, data?: any) {
    if (this.menuStack[this.menuStack.length - 1] === key) return;
    const prevTop = this.menuStack.length
      ? this.menuStack[this.menuStack.length - 1]
      : this.scene.key;

    this.scene.launch(key, { ...data, parentKey: this.scene.key });
    this.menuStack.push(key);
    const subMenu = this.scene.get(key) as Phaser.Scene;

    subMenu.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      const idx = this.menuStack.lastIndexOf(key);
      if (idx >= 0) this.menuStack.splice(idx, 1);
      const newTop = this.menuStack.length
        ? this.menuStack[this.menuStack.length - 1]
        : this.scene.key;
      this.scene.bringToTop(newTop);
      this.updateMenuInputFocus();
    });
    subMenu.events.once(Phaser.Scenes.Events.CREATE, () => {
      this.scene.bringToTop(key);
      this.updateMenuInputFocus();
    });
  }

  private updateMenuInputFocus() {
    const top = this.menuStack.length
      ? this.menuStack[this.menuStack.length - 1]
      : this.scene.key;

    const sceneKeys = [this.scene.key, ...this.menuStack];
    sceneKeys.forEach((k) => {
      const sc = this.scene.get(k) as Phaser.Scene;
      sc.input.keyboard!.enabled = k === top;
      if (k !== top) {
        sc.input.keyboard!.resetKeys();
      } else {
        console.debug(`Input focus on scene ${k}`);
      }
    });
  }
}
