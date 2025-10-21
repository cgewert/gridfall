import { Soundtrack } from "../audio";
import {
  PAUSE_OVERLAY_BACKGROUND_COLOR,
  PAUSE_OVERLAY_OPACITY,
} from "../colors";
import {
  BlockSkin,
  SHAPE_TO_BLOCKSKIN_FRAME,
  SHAPE_TYPES,
  SHAPES,
  TetriminoShape,
} from "../shapes";
import { ShapesSpawner, SpawnSystem } from "../spawn";
import { gravityLevels } from "../speedCurves";
import Phaser from "phaser";
import { Rotation, GetKickData } from "../rotation";
import {
  DEFAULT_MENU_FONT,
  GUI_COMBO_STYLE,
  GUI_LABEL_HOLDBOX_STYLE,
  GUI_LEVEL_STYLE,
  GUI_LINES_STYLE,
  GUI_SCORE_STYLE,
  MENU_TITLE_FONT_COLOR,
  PAUSE_OVERLAY_FONT_STYLE_ACTIVE_ENTRY,
  PAUSE_OVERLAY_FONT_STYLE_ENTRIES,
} from "../fonts";
import { t } from "i18next";
import { addSceneBackground } from "../effects/effects";
import {
  GameActions,
  GameMode,
  GameModeToString,
  LogGameAction,
} from "../game";
import { TimerDisplay } from "../ui/TimerDisplay";
import { AudioBus } from "../services/AudioBus";
import { InputSettings } from "../services/InputSettings";
import { SettingsEvents } from "../services/SettingsEvents";
import { SkinSettings } from "../services/SkinSettings";

export interface GameSceneConfiguration {
  spawnSystem: SpawnSystem;
  blockSkin: BlockSkin;
  gameMode: GameMode;
  DAS?: number;
  ARR?: number;
  softDropDAS?: number;
  softDropARR?: number;
  musicVolume?: number;
  sfxVolume?: number;
}

export class GameScene extends Phaser.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "GameScene",
  };
  private static readonly PAUSE_OVERLAY_DEPTH = 9999;
  private currentTetrimino!: Phaser.GameObjects.Group;
  private ghostGroup!: Phaser.GameObjects.Group;
  private previewGroup!: Phaser.GameObjects.Group;
  private lockedBlocksGroup!: Phaser.GameObjects.Group;
  private currentShape!: TetriminoShape;
  private currentPosition = { x: 3, y: 0 }; // Starting position
  private currentRotationIndex: Rotation = Rotation.SPAWN; // Starting rotation
  private currentTetriminoType = "T"; // Starting with T-Tetrimino
  private sakuraEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private timer!: TimerDisplay;

  private DAS = 167;
  private ARR = 33;
  private SDF = 6;
  // private softDropDAS = 100; // Softdrop Delay Auto-Shift in milliseconds
  // private softDropARR = 1; // Softdrop speed in cells per second
  private leftHeld = false;
  private rightHeld = false;
  private dasTimer: number = 0;
  private arrTimer: number = 0;

  // Gravity Fields
  private fallSpeed: number = 1.0; // in cells per second (level-based adjustable)
  private fallProgress: number = 0; // accumulated fall cells

  // Softdrop Fields
  private softDropActive: boolean = false;

  // Gamemode Fields
  private useSpeedCurve: boolean = false;

  private holdType: string | null = null;
  private holdUsedThisTurn: boolean = false;
  private holdGroup!: Phaser.GameObjects.Group;
  private holdBox!: Phaser.GameObjects.Graphics;
  private previewBox!: Phaser.GameObjects.Rectangle;
  private linesCleared: number = 0;
  private linesText!: Phaser.GameObjects.Text;
  private currentSpawnSystem: SpawnSystem = SpawnSystem.SEVEN_BAG;

  private pauseContainer!: Phaser.GameObjects.Container;
  private isPaused = false;
  private pauseIndex = 0;

  // Sounds
  private comboSound!: Phaser.Sound.BaseSound;
  private lineClearSound!: Phaser.Sound.BaseSound;
  private rotateSound!: Phaser.Sound.BaseSound;
  private lockSound!: Phaser.Sound.BaseSound;
  private rotateKickSound!: Phaser.Sound.BaseSound;
  private doubleClearSound!: Phaser.Sound.BaseSound;
  private tripleClearSound!: Phaser.Sound.BaseSound;
  private tetrisClearSound!: Phaser.Sound.BaseSound;
  private tSpinSound!: Phaser.Sound.BaseSound;
  private allClearSound!: Phaser.Sound.BaseSound;
  private holdSound!: Phaser.Sound.BaseSound;
  private moveSound!: Phaser.Sound.BaseSound;
  private softDropSound!: Phaser.Sound.BaseSound;
  private particleManager!: Phaser.GameObjects.Particles.ParticleEmitter;
  private music!: Phaser.Sound.BaseSound;

  private gameOver: boolean = false;
  private static readonly previewSize = 5; // Size of the Tetrimino preview
  private static readonly emptyGridValue = "Q"; // Placeholder for empty grid cells
  private static readonly gridWidth = 10;
  private static readonly gridHeight = 20;
  private static readonly blockSize = 40; // Size in pixels
  private static readonly totalGridWidth =
    GameScene.gridWidth * GameScene.blockSize;
  private static readonly totalGridHeight =
    GameScene.gridHeight * GameScene.blockSize;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private score: number = 0;
  private combo: number = 0;
  private level: number = 1;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private comboActive: boolean = false;

  private grid!: string[][];
  private blocksGroup!: Phaser.GameObjects.Group;
  private spawner!: ShapesSpawner;
  private lastMoveWasRotation: boolean = false;
  private lastWasTSpin: boolean = false;

  private _main: Phaser.Cameras.Scene2D.Camera | null = null;
  private _viewPortHalfHeight: number = 0;
  private _viewPortHalfWidth: number = 0;

  // Game configuration fields
  private blockSkin!: BlockSkin;
  private gameMode!: GameMode;

  // Event handlers
  private onInputChanged?: (data: {
    dasMs: number;
    arrMs: number;
    sdfTps: number;
  }) => void;

  constructor() {
    super(GameScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: GameSceneConfiguration) {
    this.currentSpawnSystem = data?.spawnSystem ?? SpawnSystem.SEVEN_BAG;
    this.blockSkin = SkinSettings.get() as BlockSkin;
    this.gameMode = data?.gameMode ?? GameMode.ASCENT;
    if (this.gameMode === GameMode.ASCENT) {
      this.useSpeedCurve = true;
    } else {
      this.useSpeedCurve = false;
    }

    this.gameOver = false;
    this.isPaused = false;
    this.holdUsedThisTurn = false;
    this.holdType = null;
    this.linesCleared = 0;
    this.score = 0;
    this.combo = 0;
    this.level = 1;
    this.fallSpeed = 1.0;
    this.leftHeld = false;
    this.rightHeld = false;
    this.softDropActive = false;
    this.dasTimer = 0;
    this.arrTimer = 0;
    this.initializeGrid();
    this.spawner = new ShapesSpawner(this.currentSpawnSystem);
    console.log(
      "GameScene initialized with Game Mode:",
      GameModeToString(this.gameMode)
    );
  }

  public preload() {
    // Loading music
    this.load.audio("track1", Soundtrack.track1);
    // Loading sfx
    this.load.audio("comboSound", "assets/audio/sfx/combo.mp3");
    this.load.audio("lineClearSound", "assets/audio/sfx/clear.wav");
    this.load.audio("rotateSound", "assets/audio/sfx/rotate.wav");
    this.load.audio("lockSound", "assets/audio/sfx/lock.wav");
    this.load.audio("rotatekick", "assets/audio/sfx/rotatekick.ogg");
    this.load.audio("double", "assets/audio/sfx/double.ogg");
    this.load.audio("triple", "assets/audio/sfx/triple.ogg");
    this.load.audio("tetra", "assets/audio/sfx/tetra.wav");
    this.load.audio("tSpin", "assets/audio/sfx/tspin.ogg");
    this.load.audio("allClear", "assets/audio/sfx/all_clear.ogg");
    this.load.audio("hold", "assets/audio/sfx/hold.ogg");
    this.load.audio("move", "assets/audio/sfx/move.ogg");
    this.load.audio("softDrop", "assets/audio/sfx/soft-drop.wav");
    // Loading images
    this.load.image("sparkle", "assets/gfx/sprites/sparkle.png");
    this.load.image(
      "sakuraParticle",
      "assets/gfx/particles/sakura_particle.png"
    );
    this.load.image(
      "sakuraParticle2",
      "assets/gfx/particles/sakura_particle2.png"
    );
  }

  private createPauseOverlay(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      PAUSE_OVERLAY_BACKGROUND_COLOR,
      PAUSE_OVERLAY_OPACITY
    );

    const title = this.add
      .text(width / 2, height / 2 - 80, t("pause.title"), {
        fontFamily: DEFAULT_MENU_FONT,
        fontSize: "32px",
        color: MENU_TITLE_FONT_COLOR,
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const options = [t("pause.resume"), t("pause.backToMenu")];
    const optionTexts = options.map((text, i) =>
      this.add
        .text(
          width / 2,
          height / 2 + i * 50,
          text,
          PAUSE_OVERLAY_FONT_STYLE_ENTRIES
        )
        .setOrigin(0.5)
    );
    this.pauseContainer = this.add.container(0, 0, [bg, title, ...optionTexts]);
    this.pauseContainer
      .setAlpha(0)
      .setVisible(true)
      .setDepth(GameScene.PAUSE_OVERLAY_DEPTH);
  }

  private createHoldBox(): void {
    const boxX = this.gridOffsetX - 120;
    const boxY = this.gridOffsetY;
    const boxWidth = 120;
    const boxHeight = 120;

    this.holdBox = this.add
      .graphics()
      .fillStyle(0xffffff, 1.0)
      .fillRoundedRect(boxX, boxY, boxWidth, boxHeight)
      .fillStyle(0x000000, 0.8)
      .fillRoundedRect(boxX + 5, boxY + 5, boxWidth - 10, boxHeight - 10);
    this.add
      .text(boxX, boxY - 24, t("labels.holdBox"), GUI_LABEL_HOLDBOX_STYLE)
      .setOrigin(1, 0);
  }

  private createPreviewBox(): void {
    const boxX =
      this.gridOffsetX + GameScene.gridWidth * GameScene.blockSize + 32;
    const boxY = this.gridOffsetY;
    const boxWidth = GameScene.blockSize * 4;
    const boxHeight = GameScene.blockSize * 10;
    this.add
      .text(boxX, boxY - 24, t("labels.nextBox"), GUI_LABEL_HOLDBOX_STYLE)
      .setOrigin(0, 0);

    this.previewBox = this.add
      .rectangle(boxX, boxY, boxWidth, boxHeight, 0x000000, 0.3)
      .setOrigin(0)
      .setStrokeStyle(2, 0xffffff, 1.0);
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: GameSceneConfiguration) {
    // Load input settings and apply them
    this.applyInputSettings();
    // Listen for live changes from the Controls menu
    this.onInputChanged = (data) => {
      this.DAS = data.dasMs;
      this.ARR = data.arrMs;
      this.SDF = data.sdfTps;
      // Reset timers to avoid weird mid-hold transitions
      this.resetAutoRepeat();
    };
    this.game.events.on(SettingsEvents.InputChanged, this.onInputChanged);
    this._main = this.cameras.main;
    this._viewPortHalfHeight = this.scale.height / 2;
    this._viewPortHalfWidth = this.scale.width / 2;
    this.timer = new TimerDisplay(this, {
      x: 16,
      y: 92,
      prefix: "TIME ",
      fontFamily: "Orbitron, monospace",
      fontSize: 28,
      color: "#FFFFFF",
      stroke: "#00FFFF",
      strokeThickness: 2,
      shadow: true,
      autostart: true,
    });
    this.timer.setDepth(10000);
    this.add.existing(this.timer);
    this.input.keyboard!.on("keydown-T", () => this.timer.start());

    this.currentSpawnSystem = data.spawnSystem;
    this.blockSkin = SkinSettings.get() as BlockSkin;
    this.gameMode = data.gameMode;

    // TODO: Game mode specific creation logic
    if (this.gameMode === GameMode.INFINITY) {
    } else if (this.gameMode === GameMode.RUSH) {
    } else if (this.gameMode === GameMode.ASCENT) {
    }

    this.gridOffsetX = this._viewPortHalfWidth - GameScene.totalGridWidth / 2;
    this.gridOffsetY = this._viewPortHalfHeight - GameScene.totalGridHeight / 2;

    addSceneBackground(this);
    this.spawner.generateNextQueue(5);
    this.previewGroup = this.add.group();
    this.currentTetrimino = this.add.group();
    this.ghostGroup = this.add.group();
    this.holdGroup = this.add.group();
    this.renderNextQueue();
    this.lockedBlocksGroup = this.add.group();

    this.music = AudioBus.AddSceneAudio(this, "track1");

    this.comboSound = AudioBus.AddSceneAudio(this, "comboSound");
    this.lineClearSound = AudioBus.AddSceneAudio(this, "lineClearSound");
    this.rotateSound = AudioBus.AddSceneAudio(this, "rotateSound");
    this.lockSound = AudioBus.AddSceneAudio(this, "lockSound");
    this.rotateKickSound = AudioBus.AddSceneAudio(this, "rotatekick");
    this.doubleClearSound = AudioBus.AddSceneAudio(this, "double");
    this.tripleClearSound = AudioBus.AddSceneAudio(this, "triple");
    this.tetrisClearSound = AudioBus.AddSceneAudio(this, "tetra");
    this.tSpinSound = AudioBus.AddSceneAudio(this, "tSpin");
    this.allClearSound = AudioBus.AddSceneAudio(this, "allClear");
    this.holdSound = AudioBus.AddSceneAudio(this, "hold");
    this.moveSound = AudioBus.AddSceneAudio(this, "move");
    this.softDropSound = AudioBus.AddSceneAudio(this, "softDrop").on(
      "finish",
      () => {
        AudioBus.PlaySfx(this, "softDrop");
      }
    );

    this.particleManager = this.add
      .particles(0, 0, "sparkle", {
        quantity: 2,
        lifespan: { min: 300, max: 700 },
        speed: { min: 80, max: 160 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.35, end: 0 },
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
        emitting: false,
        blendMode: "ADD",
      })
      .setDepth(1001);

    this.sakuraEmitter = this.add
      .particles(0, 0, "sakuraParticle", {
        x: {
          onEmit: (
            particle: Phaser.GameObjects.Particles.Particle | undefined
          ) => {
            const x = Phaser.Math.Between(0, this.scale.width);
            return x;
          },
        },
        y: {
          onUpdate: (
            _particle: Phaser.GameObjects.Particles.Particle,
            _key,
            t,
            value
          ) => {
            return value + t * 10;
          },
        },
        lifespan: 5000,
        speedY: { min: 60, max: 80 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.1, end: 0.01 },
        alpha: { start: 1, end: 1 },
        rotate: {
          onEmit: (_particle) => {
            return 0;
          },
          onUpdate: (particle) => {
            return (particle.angle += 0.5);
          },
        },
        angle: { min: 0, max: 360 },
        frequency: 800,
        quantity: 1,
        gravityY: 0,
        emitZone: {
          source: new Phaser.Geom.Rectangle(0, -10, this.scale.width, 1),
          type: "edge",
          quantity: this.scale.width / 30,
        },
        active: false,
      })
      .setDepth(10000);

    this.linesText = this.add.text(
      this.gridOffsetX + GameScene.gridWidth * GameScene.blockSize + 32,
      this.gridOffsetY + GameScene.blockSize * 11,
      "LINES: 0",
      GUI_LINES_STYLE
    );

    this.scoreText = this.add.text(
      20,
      20,
      `${t("labels.score")}: 0`,
      GUI_SCORE_STYLE
    );

    this.levelText = this.add.text(
      20,
      50,
      `${t("labels.level")}: 1 (${t("gravity")} ${this.fallSpeed.toFixed(2)})`,
      GUI_LEVEL_STYLE
    );

    this.comboText = this.add.text(20, 80, "", GUI_COMBO_STYLE);

    this.initializeGrid();
    this.createGridGraphics(0xffffff, 0.9);
    this.spawnTetrimino();
    this.createHoldBox();
    this.createPreviewBox();
    this.createPauseOverlay();
    this.setUpKeyboardControls();

    AudioBus.PlayMusic(this, "track1", { loop: true });
  }

  private setUpKeyboardControls() {
    if (!this.input?.keyboard) return;

    // TODO: Refactor to use polling instead of events for better control
    this.input.keyboard.on("keydown-LEFT", () => {
      if (this.isPaused) return;
      this.leftHeld = true;
      this.moveTetrimino(-1);
      this.dasTimer = this.time.now + this.DAS;
    });

    this.input.keyboard.on("keyup-LEFT", () => {
      if (this.isPaused) return;
      this.leftHeld = false;
    });

    this.input.keyboard.on("keydown-RIGHT", () => {
      if (this.isPaused) return;
      this.rightHeld = true;
      this.moveTetrimino(1);
      this.dasTimer = this.time.now + this.DAS;
    });

    this.input.keyboard.on("keyup-RIGHT", () => {
      if (this.isPaused) return;
      this.rightHeld = false;
    });

    this.input.keyboard.on("keydown-P", () => {
      if (!this.isPaused) {
        this.pauseGame();
      } else {
        this.resumeGame();
      }
    });

    this.input.keyboard.on("keydown-UP", () => {
      if (this.isPaused) {
        this.pauseIndex = Math.abs(this.pauseIndex - 1) % 2;
        this.updatePauseHighlight();
      } else {
        this.hardDrop();
      }
    });

    this.input.keyboard.on("keyup-DOWN", () => {
      this.softDropActive = false;
      // this.fallProgress = Math.floor(this.fallProgress); // Activate SDF Behaviour?
      // this.softDropSound.stop();
    });

    this.input.keyboard.on("keydown-DOWN", () => {
      if (this.isPaused) {
        this.pauseIndex = (this.pauseIndex + 1) % 2;
        this.updatePauseHighlight();
      } else {
        if (this.softDropActive) return;
        this.softDropActive = true;
        //AudioBus.PlaySfx(this, "softDrop");
      }
    });

    this.input.keyboard.on("keydown-ENTER", () => {
      if (!this.isPaused) return;
      if (this.pauseIndex === 0) {
        this.resumeGame();
      } else {
        // Set data for the start call
        const data: GameSceneConfiguration = {
          spawnSystem: this.currentSpawnSystem,
          blockSkin: this.blockSkin,
          gameMode: this.gameMode,
        };
        this.scene.start("MainMenuScene", data);
      }
    });

    this.input.keyboard.on("keydown", (event: KeyboardEvent) => {
      if (this.isPaused) return;

      switch (event.key.toLowerCase()) {
        case "y":
          this.rotateTetrimino("left");
          break;
        case "x":
          this.rotateTetrimino("right");
          break;
        case " ":
          this.holdTetrimino();
          break;
      }
    });
  }

  private pauseGame(): void {
    this.physics.world.pause();
    this.isPaused = true;
    this.tweens.add({
      targets: this.pauseContainer,
      alpha: 1,
      duration: 250,
      ease: "Sine.easeOut",
    });
    this.pauseIndex = 0;
    this.sakuraEmitter.setActive(true);
    this.updatePauseHighlight();
  }

  private resumeGame(): void {
    this.physics.world.resume();
    this.isPaused = false;
    this.sakuraEmitter.killAll();
    this.sakuraEmitter.setActive(false);
    this.tweens.add({
      targets: this.pauseContainer,
      alpha: 0,
      duration: 250,
      ease: "Sine.easeOut",
    });
  }

  private updatePauseHighlight(): void {
    this.pauseContainer.iterate((obj: Phaser.GameObjects.Text) => {
      if (obj instanceof Phaser.GameObjects.Text) {
        const textIndex = this.pauseContainer.getIndex(obj);
        if (textIndex === 1) return; // Skip the title text
        obj.setStyle(PAUSE_OVERLAY_FONT_STYLE_ENTRIES);
      }
    });

    const active = this.pauseContainer.getAt(
      2 + this.pauseIndex
    ) as Phaser.GameObjects.Text;
    active.setStyle(PAUSE_OVERLAY_FONT_STYLE_ACTIVE_ENTRY);
  }

  private initializeGrid(): void {
    this.grid = Array.from({ length: GameScene.gridHeight }, () =>
      Array(GameScene.gridWidth).fill(GameScene.emptyGridValue)
    );
  }

  private createGridGraphics(
    color: number = 0xffffff,
    opacity: number = 1.0
  ): void {
    this.blocksGroup = this.add.group();

    for (let y = 0; y < GameScene.gridHeight; y++) {
      for (let x = 0; x < GameScene.gridWidth; x++) {
        const posX = x * GameScene.blockSize + this.gridOffsetX;
        const posY = y * GameScene.blockSize + this.gridOffsetY;

        const block = this.add.rectangle(
          posX,
          posY,
          GameScene.blockSize,
          GameScene.blockSize,
          color,
          opacity
        );

        block.setOrigin(0);
        block.setStrokeStyle(1, 0x000000, 0.85);
        this.blocksGroup.add(block);
      }
    }
  }

  private spawnHeldTetrimino(): void {
    this.currentRotationIndex = 0;
    this.currentShape = SHAPES[this.currentTetriminoType][0];
    this.currentPosition = { x: 3, y: 0 };

    if (this.checkCollision(0, 0)) {
      this.handleGameOver();
      return;
    }

    this.createTetriminoBlocks();
    this.updateTetriminoPosition();
    this.updateGhost();
  }

  private createTetriminoBlocks(): void {
    this.currentTetrimino?.clear(true, true);

    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const blockX =
            (this.currentPosition.x + x) * GameScene.blockSize +
            this.gridOffsetX;
          const blockY =
            (this.currentPosition.y + y) * GameScene.blockSize +
            this.gridOffsetY;

          const frame = SHAPE_TO_BLOCKSKIN_FRAME[this.currentTetriminoType];
          const block = this.add.sprite(blockX, blockY, this.blockSkin, frame);
          block.setDisplaySize(GameScene.blockSize, GameScene.blockSize);
          block.setOrigin(0);
          this.currentTetrimino.add(block);
        }
      });
    });
  }

  private spawnTetrimino(): void {
    this.currentTetriminoType = this.spawner.NextQueue.shift()!;
    this.spawner.NextQueue.push(this.spawner.getNext());

    this.currentRotationIndex = 0;
    if (SHAPE_TYPES.includes(this.currentTetriminoType)) {
      this.currentShape = SHAPES[this.currentTetriminoType][0];
    } else {
      throw new Error("Invalid Tetrimino Type");
    }

    this.currentPosition = { x: 3, y: 0 };

    this.renderNextQueue();
    this.createTetriminoBlocks();
    this.updateGhost();

    if (this.checkCollision(0, 0)) {
      this.handleGameOver();
      return;
    }
  }

  private renderHold(): void {
    this.holdGroup?.clear(true, true);
    this.holdGroup = this.add.group();

    if (!this.holdType) return;

    const shape = SHAPES[this.holdType][0];

    const cols = shape[0].length;
    const rows = shape.length;

    const offsetX =
      (GameScene.blockSize * 3 - cols * (GameScene.blockSize / 2)) / 2;
    const offsetY =
      (GameScene.blockSize * 3 - rows * (GameScene.blockSize / 2)) / 2;

    const startX = this.gridOffsetX - GameScene.blockSize * 4 + offsetX;
    const startY = this.gridOffsetY + offsetY;

    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const block = this.add
            .sprite(
              startX + x * (GameScene.blockSize / 2),
              startY + y * (GameScene.blockSize / 2),
              this.blockSkin,
              SHAPE_TO_BLOCKSKIN_FRAME[this.holdType!]
            )
            .setOrigin(0)
            .setDisplaySize(GameScene.blockSize / 2, GameScene.blockSize / 2);

          this.holdGroup.add(block);
        }
      });
    });
  }

  private holdTetrimino(): void {
    if (this.holdUsedThisTurn) return;

    this.holdUsedThisTurn = true;
    this.currentTetrimino?.clear(true, true);

    if (this.holdType) {
      console.debug("Swapping current piece with hold piece");
      const temp = this.currentTetriminoType;
      this.currentTetriminoType = this.holdType;
      this.holdType = temp;
      this.spawnHeldTetrimino();
    } else {
      console.debug("Holding current piece and spawn new piece");
      this.holdType = this.currentTetriminoType;
      this.spawnTetrimino();
    }

    AudioBus.PlaySfx(this, "hold");
    this.renderHold();
  }

  private renderNextQueue(): void {
    this.previewGroup?.clear(true, true);

    const previewBoxHeight = GameScene.blockSize * 10;
    const tetriminoHeight = GameScene.blockSize * 2;
    const previewContentHeight = GameScene.previewSize * tetriminoHeight;
    const startX =
      this.gridOffsetX + GameScene.gridWidth * GameScene.blockSize + 32;

    const adjustedStartY =
      this.gridOffsetY +
      (previewBoxHeight - previewContentHeight) / 2 -
      GameScene.blockSize;

    this.spawner.NextQueue.slice(0, GameScene.previewSize).forEach(
      (type, index) => {
        const shape = SHAPES[type][0];
        const cols = shape[0].length;
        const rows = shape.length;

        const offsetX =
          (GameScene.blockSize * 4 - cols * (GameScene.blockSize / 2)) / 2;
        const offsetY =
          (GameScene.blockSize * 4 - rows * (GameScene.blockSize / 2)) / 2;

        const previewX = startX + offsetX;
        const previewY =
          adjustedStartY + index * GameScene.blockSize * 2 + offsetY;

        shape.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) {
              const block = this.add
                .sprite(
                  previewX + x * (GameScene.blockSize / 2),
                  previewY + y * (GameScene.blockSize / 2),
                  this.blockSkin,
                  SHAPE_TO_BLOCKSKIN_FRAME[type]
                )
                .setOrigin(0)
                .setDisplaySize(
                  GameScene.blockSize / 2,
                  GameScene.blockSize / 2
                );

              this.previewGroup.add(block);
            }
          });
        });
      }
    );
  }

  private moveTetrimino(direction: number): void {
    if (this.checkCollision(direction, 0)) return;

    this.currentPosition.x += direction;
    this.updateTetriminoPosition();
    this.updateGhost();
    AudioBus.PlaySfx(this, "move");
  }

  private updateGhost(): void {
    const frame = SHAPE_TO_BLOCKSKIN_FRAME[this.currentTetriminoType];
    this.ghostGroup?.clear(true, true);
    this.ghostGroup = this.add.group();

    let ghostY = this.currentPosition.y;
    while (!this.checkCollision(0, ghostY - this.currentPosition.y + 1)) {
      ghostY++;
    }

    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const posX =
            (this.currentPosition.x + x) * GameScene.blockSize +
            this.gridOffsetX;
          const posY = (ghostY + y) * GameScene.blockSize + this.gridOffsetY;

          const block = this.add
            .sprite(posX, posY, this.blockSkin, frame)
            .setAlpha(0.3)
            .setOrigin(0)
            .setDisplaySize(GameScene.blockSize, GameScene.blockSize);

          this.ghostGroup.add(block);
        }
      });
    });
  }

  private rotateTetrimino(direction: "left" | "right"): void {
    const from = this.currentRotationIndex;
    const to = this.getNextRotation(from, direction);
    const kicks = GetKickData(this.currentTetriminoType, from, to) ?? [];
    const shape = SHAPES[this.currentTetriminoType][to];

    for (const kick of kicks) {
      const newX = this.currentPosition.x + kick.x;
      const newY = this.currentPosition.y + kick.y;

      if (!this.checkCollision(kick.x, kick.y, shape)) {
        this.currentRotationIndex = to;
        this.currentShape = shape;
        this.currentPosition.x = newX;
        this.currentPosition.y = newY;
        this.lastMoveWasRotation = true;
        this.createTetriminoBlocks();
        this.moveTetrimino(0);
        if (this.isTSpin()) {
          AudioBus.PlaySfx(this, "rotatekick");
          this.lastWasTSpin = true;
        } else {
          AudioBus.PlaySfx(this, "rotateSound");
          this.lastWasTSpin = false;
        }

        return;
      }
    }
    this.lastMoveWasRotation = false;

    console.warn(`${t("debug.rotationNotPossible")}: ${direction}`);
  }

  private getNextRotation(
    from: Rotation,
    direction: "left" | "right"
  ): Rotation {
    if (direction === "right") return (from + 1) % 4;
    if (direction === "left") return (from + 3) % 4;

    return from;
  }

  private hardDrop(): void {
    LogGameAction(GameActions.HARD_DROP);
    while (!this.checkCollision(0, 1, this.currentShape)) {
      this.currentPosition.y += 1;
    }
    this.updateTetriminoPosition();
    this.lockTetrimino();
  }

  private checkCollision(
    offsetX: number,
    offsetY: number,
    shape = this.currentShape
  ): boolean {
    const posX = this.currentPosition.x + offsetX;
    const posY = this.currentPosition.y + offsetY;

    return shape.some((row, y) => {
      return row.some((cell, x) => {
        if (cell) {
          const gridX = posX + x;
          const gridY = posY + y;

          if (
            gridX < 0 ||
            gridX >= GameScene.gridWidth ||
            gridY >= GameScene.gridHeight
          ) {
            return true;
          }

          if (
            gridY >= 0 &&
            this.grid[gridY][gridX] !== GameScene.emptyGridValue
          ) {
            return true;
          }
        }
        return false;
      });
    });
  }

  private updateTetriminoPosition(): void {
    const landed = this.checkCollision(0, 1, this.currentShape);
    const useFraction = !landed;
    const baseY =
      this.currentPosition.y + (useFraction ? this.fallProgress : 0);
    const blockSize = GameScene.blockSize;
    let blockIndex = 0;
    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const blockX =
            (this.currentPosition.x + x) * blockSize + this.gridOffsetX;
          const blockY = (baseY + y) * GameScene.blockSize + this.gridOffsetY;
          const block = this.currentTetrimino.getChildren()[
            blockIndex
          ] as Phaser.GameObjects.Rectangle;
          block.setPosition(Math.round(blockX), Math.round(blockY));
          blockIndex++;
        }
      });
    });
  }

  private lockTetrimino(): void {
    LogGameAction(GameActions.LOCK_PIECE);
    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const gridX = this.currentPosition.x + x;
          const gridY = this.currentPosition.y + y;
          this.grid[gridY][gridX] = this.currentTetriminoType;
        }
      });
    });
    this.currentTetrimino.clear(true, true);
    this.checkAndClearLines();
    this.drawLockedBlocks();
    this.spawnTetrimino();
    this.holdUsedThisTurn = false;
    this._main?.shake(50, 0.005);
    AudioBus.PlaySfx(this, "lockSound");
  }

  private drawLockedBlocks(): void {
    this.lockedBlocksGroup.clear(true, true);

    this.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== GameScene.emptyGridValue) {
          const block = this.add
            .sprite(
              x * GameScene.blockSize + this.gridOffsetX,
              y * GameScene.blockSize + this.gridOffsetY,
              this.blockSkin,
              this.getOriginalSkinFrame(cell)
            )
            .setOrigin(0)
            .setDisplaySize(GameScene.blockSize, GameScene.blockSize);

          this.lockedBlocksGroup.add(block);
        }
      });
    });
  }

  private getOriginalSkinFrame(cell: string): number {
    const frame = SHAPE_TO_BLOCKSKIN_FRAME[cell];
    return frame !== undefined ? frame : 7; // Fallback to 7 if not found
  }

  private checkAndClearLines(): void {
    LogGameAction(GameActions.CHECK_FOR_LINE_CLEAR);
    let clearedLinesCount = 0;
    for (let y = GameScene.gridHeight - 1; y >= 0; y--) {
      if (this.grid[y].every((cell) => cell !== GameScene.emptyGridValue)) {
        const offset = GameScene.blockSize / 2;
        for (let x = 0; x < GameScene.gridWidth; x++) {
          const posX = this.gridOffsetX + x * GameScene.blockSize + offset;
          const posY = (y + 1) * GameScene.blockSize + offset;
          this.particleManager.emitParticleAt(posX, posY);
        }
        this.clearLine(y);
        clearedLinesCount++;
        y++;
      }
    }

    if (clearedLinesCount > 0) {
      this.linesCleared += clearedLinesCount;
      if (this.comboActive) {
        this.combo++;
        this.comboText.setText(`${t("labels.combo")} x${this.combo}`);
        const maxPitch = 2.0;
        const pitch = 1.0 + ((this.combo - 2) / 13) * (maxPitch - 1.0);
        const clampedPitch = Phaser.Math.Clamp(pitch, 1.0, maxPitch);
        AudioBus.PlaySfx(this, "comboSound", { rate: clampedPitch });
      } else {
        this.comboActive = true;
        this.combo = 0;
      }

      this.playLineClearSound(clearedLinesCount);
      this.addScore(clearedLinesCount);

      // Level-Up all 10 lines
      const levelBefore = this.level;
      this.level = Math.floor(this.linesCleared / 10) + 1;

      if (this.level > levelBefore) {
        // Change fall speed based on level
        this.fallSpeed = 1.0 + (this.level - 1) * 0.15; // e.g. slightly increasing
        console.log(
          `Level up! New level: ${this.level} - Fall Speed: ${this.fallSpeed}`
        );
        this.levelText.setText(
          `${t("labels.level")}: ${this.level} (${t(
            "gravity"
          )} ${this.fallSpeed.toFixed(2)})`
        );
      }
      this.linesText.setText(`${t("labels.lines")}: ${this.linesCleared}`);
    } else {
      this.combo = 0;
      this.comboActive = false;
      this.comboText.setText("");
    }
  }

  private doGameModeLogic() {
    switch (this.gameMode) {
      case GameMode.RUSH:
        // No additional logic needed for Sprint mode on line clear
        break;
      case GameMode.ASCENT:
        if (this.linesCleared % 10 === 0) {
          this.level++;
          this.updateFallSpeed();
        }
        break;
      case GameMode.INFINITY:
        break;
      default:
        break;
    }
  }

  private checkWinCondition() {
    //LogGameAction(GameActions.CHECK_FOR_WIN_CONDITION);
    switch (this.gameMode) {
      case GameMode.RUSH:
        this.checkSprintWin();
        break;
      case GameMode.ASCENT:
        this.checkAscentWin();
        break;
      case GameMode.INFINITY:
        break;
      default:
        break;
    }
  }

  private checkAscentWin() {
    if (this.linesCleared >= 150) {
      LogGameAction(GameActions.ASCENT_VICTORY);
      this.triggerVictory();
    }
  }

  private checkSprintWin() {
    if (this.linesCleared >= 40) {
      LogGameAction(GameActions.RUSH_VICTORY);
      this.triggerVictory();
    }
  }

  private triggerVictory(): void {
    // TODO: Determine game mode inside Victory Scene
    this.gameOver = true;
    this.music.stop();
    this.scene.start("VictoryScene", {
      score: this.score,
    });
  }

  private updateFallSpeed(): void {
    if (this.useSpeedCurve) {
      this.fallSpeed =
        gravityLevels[Math.min(this.level - 1, gravityLevels.length - 1)] * 60;
    } else {
      this.fallSpeed = 1.0 + (this.level - 1) * 0.15;
    }
  }

  private clearLine(lineIndex: number): void {
    LogGameAction(GameActions.LINE_CLEAR);
    this.grid.splice(lineIndex, 1);
    this.grid.unshift(
      new Array(GameScene.gridWidth).fill(GameScene.emptyGridValue)
    );
  }

  private addScore(linesCleared: number) {
    let basePoints = 0;

    switch (linesCleared) {
      case 1:
        basePoints = 100;
        break;
      case 2:
        basePoints = 300;
        break;
      case 3:
        basePoints = 500;
        break;
      case 4:
        basePoints = 800;
        break;
    }

    const comboBonus = this.combo * 50;
    const points = (basePoints + comboBonus) * this.level;
    this.score += points;

    this.scoreText.setText(`Score: ${this.score}`);
  }

  private playLineClearSound(clearedLinesCount: number) {
    if (clearedLinesCount > 0) {
      if (this.comboActive) {
        this.time.delayedCall(100, () => {
          this.playLineClearActionSfx(clearedLinesCount);
        });
      } else {
        this.playLineClearActionSfx(clearedLinesCount);
      }
    }
    if (
      this.grid.every((row) =>
        row.every((cell) => cell === GameScene.emptyGridValue)
      )
    ) {
      AudioBus.PlaySfx(this, "allClear");
    }
  }

  playLineClearActionSfx(clearedLinesCount: number) {
    if (clearedLinesCount < 1) return;

    AudioBus.PlaySfx(this, "lineClearSound");

    if (this.lastWasTSpin) {
      // TODO: Detect different T-Spin types
      AudioBus.PlaySfx(this, "tSpin");
      return;
    }

    switch (clearedLinesCount) {
      case 2:
        AudioBus.PlaySfx(this, "double");
        break;
      case 3:
        AudioBus.PlaySfx(this, "triple");
        break;
      case 4:
        AudioBus.PlaySfx(this, "tetra");
        break;
      default:
        break;
    }
  }

  private handleGameOver(): void {
    this.gameOver = true;
    this.sound.stopAll();
    this.music.stop();
    this.scene.start("GameOverScene", {
      spawnSystem: this.currentSpawnSystem,
      blockSkin: this.blockSkin,
      gameMode: this.gameMode,
    });
  }

  private isTSpin(): boolean {
    if (this.currentTetriminoType !== "T") return false;
    if (!this.lastMoveWasRotation) return false;

    let corners = 0;
    const cx = this.currentPosition.x + 1;
    const cy = this.currentPosition.y + 1;

    const checks = [
      { x: cx - 1, y: cy - 1 },
      { x: cx + 1, y: cy - 1 },
      { x: cx - 1, y: cy + 1 },
      { x: cx + 1, y: cy + 1 },
    ];

    for (const check of checks) {
      if (this.grid[check.y]?.[check.x] !== GameScene.emptyGridValue) corners++;
    }

    return corners >= 3;
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    this.checkWinCondition();
    this.doGameModeLogic();
    if (!this.isPaused && !this.gameOver) {
      let effectiveFallSpeed = this.fallSpeed;

      if (this.softDropActive) {
        effectiveFallSpeed += this.SDF;
      }

      this.fallProgress += effectiveFallSpeed * (delta / 1000); // delta in ms → s

      while (this.fallProgress >= 1) {
        if (!this.checkCollision(0, 1, this.currentShape)) {
          this.currentPosition.y += 1;
          this.fallProgress -= 1.0;
        } else {
          this.lockTetrimino();
          this.fallProgress = 0;
          break;
        }
      }

      if (this.leftHeld && time > this.dasTimer) {
        if (time > this.arrTimer) {
          this.moveTetrimino(-1);
          this.arrTimer = time + this.ARR;
        }
      }

      if (this.rightHeld && time > this.dasTimer) {
        if (time > this.arrTimer) {
          this.moveTetrimino(1);
          this.arrTimer = time + this.ARR;
        }
      }

      this.updateTetriminoPosition();
    }
  }

  private applyInputSettings() {
    this.DAS = InputSettings.DAS;
    this.ARR = InputSettings.ARR;
    this.SDF = InputSettings.SDF;
    this.resetAutoRepeat();
  }

  private resetAutoRepeat() {
    this.dasTimer = 0;
    this.arrTimer = 0;
  }

  // // Called when a direction key is pressed
  // private startHold(dir: -1 | 1) {
  //   // If opposite was held, release it
  //   if (dir === -1) this.rightHeld = false;
  //   else this.leftHeld = false;

  //   if (dir === -1) this.leftHeld = true;
  //   if (dir === 1) this.rightHeld = true;

  //   this.lastDir = dir;

  //   // Initial single move immediately
  //   this.moveHoriz(dir);

  //   // (re)start DAS
  //   this.dasTimer = this.dasMs;
  //   this.arrTimer = 0;
  // }
}
