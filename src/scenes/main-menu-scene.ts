import * as Phaser from "phaser";
import { GameSceneConfiguration } from "./game-scene";
import { BlockSkin } from "../shapes";
import { SpawnSystem } from "../spawn";
import { addScanlines, addSceneBackground } from "../effects/effects";
import { AudioAnalysis, CreateAudioAnalysis, GameMode } from "../game";
import { MenuList } from "../ui/menu/MenuList";
import { Soundtrack } from "../audio";

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

  private menu!: MenuList;
  private audioAnalyser: AudioAnalysis = {} as AudioAnalysis;
  private music?: Phaser.Sound.WebAudioSound;
  private selectedEntry = MenuEntry.ENDLESS;
  private currentSpawn = SpawnSystem.SEVEN_BAG;
  private blockSkin: BlockSkin = BlockSkin.MINOS2;
  private gameMode: GameMode = GameMode.ENDLESS;
  private blockpreview!: Phaser.GameObjects.Sprite;

  constructor() {
    super(MainMenuScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: GameSceneConfiguration) {
    this.selectedEntry = (data?.gameMode as number) ?? MenuEntry.ENDLESS;
    this.currentSpawn = data?.spawnSystem ?? SpawnSystem.SEVEN_BAG;
    this.gameMode = data?.gameMode ?? GameMode.ENDLESS;
    switch (data?.gameMode) {
      case GameMode.MARATHON:
        this.selectedEntry = MenuEntry.MARATHON;
        break;
      case GameMode.SPRINT:
        this.selectedEntry = MenuEntry.SPRINT;
        break;
      case GameMode.ENDLESS:
        this.selectedEntry = MenuEntry.ENDLESS;
        break;
    }
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
    addSceneBackground(this);
    addScanlines(this, { alpha: 0.08, speedY: 2.2 });

    this.menu = new MenuList(this, {
      x: this.scale.width * 0.5,
      y: this.scale.height * 0.62,
      gap: 64,
      onMoveSoundKey: "ui-move",
      onChooseSoundKey: "ui-choose",
      items: [
        { label: "Sprint", disabled: false },
        { label: "Marathon", disabled: false },
        { label: "Options", disabled: false },
        { label: "Credits", disabled: false },
        { label: "Quit", disabled: true },
      ],
    });

    this.menu.setAction(0, () => {
      const config = {
        spawnSystem: this.currentSpawn,
        blockSkin: this.blockSkin,
        gameMode: GameMode.SPRINT,
      };
      this.scene.start("GameScene", config);
    });
    this.menu.setAction(1, () => {
      const config = {
        spawnSystem: this.currentSpawn,
        blockSkin: this.blockSkin,
        gameMode: GameMode.MARATHON,
      };
      this.scene.start("GameScene", config);
    });
    this.menu.setAction(2, () => this.scene.start("OptionsScene"));
    this.menu.setAction(3, () => this.scene.start("CreditsScene"));

    this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 6000,
      repeat: -1,
      onUpdate: (tw) => {
        const t = tw.getValue();
        this.cameras.main.setScroll(Math.sin(t!) * 6, Math.cos(t!) * 6);
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

    // const menu_entries = [
    //   () => `Marathon`,
    //   () => `Sprint`,
    //   () => `Endless`,
    //   () =>
    //     `Spawn System: ${
    //       this.currentSpawn === SpawnSystem.SEVEN_BAG ? "7-Bag" : "Random"
    //     }`,
    //   () => `Blocks: ${this.blockSkin}`,
    // ];

    // menu_entries.forEach((_entryFn, i) => {
    //   const text = this.add
    //     .text(this.scale.width / 2, baseY + i * 50, "", DEFAULT_FONT_STYLE)
    //     .setOrigin(0.5);
    //   this.menuTexts.push(text);
    //   // Draw block skin
    //   if (i === MenuEntry.BLOCK_SKIN) {
    //     const skin = this.blockSkin;
    //     this.blockpreview = this.add
    //       .sprite(this.scale.width / 2 + 225, baseY + i * 50, skin, 1)
    //       .setOrigin(0.5)
    //       .setScale(0.5);
    //   }
    // });
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    // Update the game logic here.
  }

  private setupInput(menuEntries: (() => string)[]): void {
    if (this.input?.keyboard) {
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
        } else if (this.selectedEntry === MenuEntry.BLOCK_SKIN) {
          const skins = Object.values(BlockSkin);
          this.blockSkin =
            skins[(skins.indexOf(this.blockSkin) + 1) % skins.length];
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

  private startAudio() {
    if (this.music && this.music.isPlaying) return; // already started
    this.music = this.sound.add("menuLoop", {
      loop: true,
      volume: 0.2, // TODO: Load music volume from settings
    }) as Phaser.Sound.WebAudioSound;

    this.music.play();
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
