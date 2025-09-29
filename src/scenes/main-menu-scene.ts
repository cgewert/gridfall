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

export class MainMenuScene extends Phaser.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "MainMenuScene",
  };

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
    AudioBus.AddSceneAudio(this, "ui-move");
    AudioBus.AddSceneAudio(this, "ui-choose");
    AudioBus.AddSceneAudio(this, "menuLoop", { loop: true });

    addSceneBackground(this);
    addScanlines(this, { alpha: 0.12, speedY: 1.2 });

    this.menu = new MenuList(this, {
      x: this.scale.width * 0.5,
      y: this.scale.height * 0.62,
      gap: 64,
      onMoveSoundKey: "ui-move",
      onChooseSoundKey: "ui-choose",
      items: [
        {
          label: "Ascent",
          disabled: false,
          action: () => {
            console.log("Starting Ascent mode");

            return this.startGame({
              gameMode: GameMode.ASCENT,
              blockSkin: this.blockSkin,
              spawnSystem: this.currentSpawn,
            });
          },
        },
        {
          label: "Infinity",
          disabled: false,
          action: () =>
            this.startGame({
              gameMode: GameMode.INFINITY,
              blockSkin: this.blockSkin,
              spawnSystem: this.currentSpawn,
            }),
        },
        {
          label: "Rush",
          disabled: false,
          action: () =>
            this.startGame({
              gameMode: GameMode.RUSH,
              blockSkin: this.blockSkin,
              spawnSystem: this.currentSpawn,
            }),
        },
        {
          label: "Credits",
          disabled: false,
          action: () => this.scene.start("CreditsScene"),
        },
        {
          label: "Options",
          disabled: false,
          action: () => this.scene.start("OptionsScene"),
        },
      ],
    });
    switch (this.gameMode) {
      case GameMode.ASCENT:
        this.menu.selectItem("Ascent");
        break;
      case GameMode.RUSH:
        this.menu.selectItem("Rush");
        break;
      case GameMode.INFINITY:
        this.menu.selectItem("Infinity");
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

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.music?.stop();
      this.audioAnalyser?.disconnect && this.audioAnalyser.disconnect();
      this.tweens.killAll();
    });
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

  //       } else if (this.selectedEntry === MenuEntry.SPAWN_SYSTEM) {
  //         const isNowRandom = this.currentSpawn === SpawnSystem.SEVEN_BAG;
  //         this.currentSpawn = isNowRandom
  //           ? SpawnSystem.RANDOM
  //           : SpawnSystem.SEVEN_BAG;
  //       } else if (this.selectedEntry === MenuEntry.BLOCK_SKIN) {
  //         const skins = Object.values(BlockSkin);
  //         this.blockSkin =
  //           skins[(skins.indexOf(this.blockSkin) + 1) % skins.length];
  //         this.tweens.add({
  //           targets: this.blockpreview,
  //           scale: 0.0,
  //           duration: 175,
  //           ease: "Circular.Out",
  //           onComplete: () => {
  //             this.blockpreview.setTexture(
  //               this.blockSkin,
  //               Phaser.Math.Between(0, 6)
  //             );
  //             this.tweens.add({
  //               targets: this.blockpreview,
  //               scale: 0.5,
  //               duration: 175,
  //               ease: "Circular.In",
  //             });
  //           },
  //         });

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
        //this.cameras.main.setZoom(1 + bass * 0.5);
      },
    });
  }
}
