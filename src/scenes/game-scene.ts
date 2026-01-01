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
import { ShapesSpawner } from "../spawn";
import { gravityLevels } from "../speedCurves";
import Phaser, { Display } from "phaser";
import { Rotation, GetKickData } from "../rotation";
import {
  DEFAULT_MENU_FONT,
  GUI_COMBO_STYLE,
  TEXTBOX_DEFAULT_STYLE,
  MENU_TITLE_FONT_COLOR,
  PAUSE_OVERLAY_FONT_STYLE_ACTIVE_ENTRY,
  PAUSE_OVERLAY_FONT_STYLE_ENTRIES,
  DEFAULT_FONT_STYLE,
} from "../fonts";
import { t } from "i18next";
import { addSceneBackground } from "../effects/effects";
import {
  DefaultGameModeDecorators,
  GameActions,
  GameMode,
  InputActions,
  LogGameAction,
  RoundPhase,
} from "../game";
import * as Decorators from "../ui/decorators/index";
import { AudioBus } from "../services/AudioBus";
import { InputSettings } from "../services/InputSettings";
import { SettingsEvents } from "../services/SettingsEvents";
import { SkinSettings } from "../services/SkinSettings";
import { SpawnSettings, SpawnSystem } from "../services/SpawnSettings";
import { TextBox } from "../ui/decorators/TextBox";
import { HoldBox } from "../ui/HoldBox";
import { NextPreview } from "../ui/NextPreview";
import { LineClearCountdown } from "../ui/decorators/LineClearCountdown";
import { VictorySceneData } from "./victory-scene";
import { CountdownOverlay } from "../ui/CountdownOverlay";

export type GridConfiguration = {
  borderThickness?: number;
  gridOpacity: number;
};

export interface GameSceneConfiguration {
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
  private gridCellGroup!: Phaser.GameObjects.Group;
  private currentShape!: TetriminoShape | null;
  private currentPosition = { x: 3, y: 0 }; // Starting position
  private currentRotationIndex: Rotation = Rotation.SPAWN; // Starting rotation
  private currentTetriminoType = "T";
  private sakuraEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private timer?: Decorators.TimerDisplay | null;
  private phase: RoundPhase = RoundPhase.Idle;
  private countdown!: CountdownOverlay;

  // Lock Delay System Fields
  private lockDelay: number = 2000; // 500ms standard lock delay
  private lockTimer: number = 0;
  private isLocking: boolean = false;
  private lockResets: number = 0;
  private maxLockResets: number = 15; // Number of lock resets allowed
  private maxLockTime: number = 30000; // Maximum lock time in ms
  private totalLockTime: number = 0; // Accumulated lock time

  private keys!: InputActions;

  private movementState = {
    left: { held: false, dasTimer: 0, arrTimer: 0, justPressed: false },
    right: { held: false, dasTimer: 0, arrTimer: 0, justPressed: false },
    down: { held: false },
  };

  private DAS = 167;
  private ARR = 33;
  private SDF = 6;

  // Gravity Fields
  private fallSpeed: number = 1.0; // in cells per second (level-based adjustable)
  private fallProgress: number = 0; // accumulated fall cells

  // Gamemode Fields
  private useSpeedCurve: boolean = false;

  private _holdType: string | null = null;
  private holdUsedThisTurn: boolean = false;
  private holdBox!: HoldBox;
  private nextPreview!: NextPreview;
  private linesCleared: number = 0;
  private linesText?: TextBox | null;
  private currentSpawnSystem: SpawnSystem = "sevenBag";

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
  private soundCountdownTick!: Phaser.Sound.BaseSound;
  private softDropSound!: Phaser.Sound.BaseSound;
  private particleManager!: Phaser.GameObjects.Particles.ParticleEmitter;
  private music!: Phaser.Sound.BaseSound;

  // Video
  private backgroundVideo!: Phaser.GameObjects.Video;

  private gameOver: boolean = false;
  private static readonly previewSize = 5; // Size of the Tetrimino preview
  private static readonly emptyGridValue = "Q"; // Placeholder for empty grid cells
  private static readonly gridWidth = 10;
  private static readonly gridHeight = 20;
  public static readonly BLOCKSIZE = 40;
  private static readonly totalGridWidth =
    GameScene.gridWidth * GameScene.BLOCKSIZE;
  private static readonly totalGridHeight =
    GameScene.gridHeight * GameScene.BLOCKSIZE;
  private gridOffsetX = 0;
  private gridOffsetY = 0;
  private borderThickness = 10;
  private score: number = 0;
  private combo: number = 0;
  private level: number = 1;
  private scoreText?: TextBox | null;
  private levelText?: TextBox | null;
  private linesCountdown?: LineClearCountdown | null;
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
  private _blockSkin!: BlockSkin;
  private gameMode!: GameMode;

  private checkWinCondition: CallableFunction = () => {};

  // Event handlers
  private onInputChanged?: (data: {
    dasMs: number;
    arrMs: number;
    sdfTps: number;
  }) => void;

  constructor() {
    super(GameScene.CONFIG);
  }

  public get BlockSkin(): BlockSkin {
    return this._blockSkin;
  }

  public get HoldType(): string | null {
    return this._holdType;
  }

  /* Scene initialization logic. */
  public init(data: GameSceneConfiguration) {
    this.lockTimer = 0;
    this.isLocking = false;
    this.lockResets = 0;
    this.totalLockTime = 0;

    this.currentSpawnSystem = SpawnSettings.get();
    this._blockSkin = SkinSettings.get() as BlockSkin;
    this.gameMode = data?.gameMode ?? GameMode.ASCENT;
    if (this.gameMode === GameMode.ASCENT) {
      this.useSpeedCurve = true;
    } else {
      this.useSpeedCurve = false;
    }

    this.gridCellGroup?.destroy(true, true);
    this.gameOver = false;
    this.isPaused = false;
    this.holdUsedThisTurn = false;
    this._holdType = null;
    this.linesCleared = 0;
    this.score = 0;
    this.combo = 0;
    this.level = 1;
    this.fallSpeed = 1.0;
    this.initializeGrid();
    this.spawner = new ShapesSpawner(this.currentSpawnSystem);
    this.currentShape = null;
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
    this.load.audio("countdownTick", "assets/audio/sfx/countdown-tick.wav");
    this.load.audio("countdownGo", "assets/audio/sfx/countdown-go.wav");
    // Loading images
    this.load.image("sparkle", "assets/gfx/particles/sparkle.png");
    this.load.image(
      "sakuraParticle",
      "assets/gfx/particles/sakura_particle.png"
    );
    this.load.image(
      "sakuraParticle2",
      "assets/gfx/particles/sakura_particle2.png"
    );
    // Loading videos
    //this.load.video("sakuraGarden", "assets/mov/sakura_garden.mp4");
    this.load.video("sakuraGarden", "assets/mov/bubbles.mp4");
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

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: GameSceneConfiguration) {
    addSceneBackground(this);
    this.backgroundVideo = this.add.video(0, 0, "sakuraGarden");
    const scaleX = this.scale.width / this.backgroundVideo.width;
    const scaleY = this.scale.height / this.backgroundVideo.height;
    const scale = Math.max(scaleX, scaleY);
    this.backgroundVideo.setSize(this.scale.width, this.scale.height);
    this.backgroundVideo.setScale(scale);
    this.backgroundVideo.play(true);
    const videoElement = this.backgroundVideo.video;
    if (videoElement) {
      videoElement.playbackRate = 0.33;
    }
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

    this.currentSpawnSystem = SpawnSettings.get();
    this._blockSkin = SkinSettings.get() as BlockSkin;
    this.gameMode = data.gameMode;
    switch (this.gameMode) {
      case GameMode.RUSH:
        this.checkWinCondition = this.checkRushWin;
        break;
      case GameMode.ASCENT:
        this.checkWinCondition = this.checkAscentWin;
        break;
      case GameMode.INFINITY:
        this.checkWinCondition = () => {};
        break;
      default:
        break;
    }

    this.gridOffsetX = this._viewPortHalfWidth - GameScene.totalGridWidth / 2;
    this.gridOffsetY = this._viewPortHalfHeight - GameScene.totalGridHeight / 2;

    this.spawner.generateNextQueue(5);
    this.previewGroup = this.add.group();
    this.currentTetrimino = this.add.group();
    this.ghostGroup = this.add.group();
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

    this.comboText = this.add.text(0, 0, "", GUI_COMBO_STYLE);

    this.initializeGrid();
    this.createGridGraphics({
      borderThickness: 25,
      gridOpacity: 1.0,
    });
    this.holdBox = new HoldBox(this, 0, 0, {
      borderThickness: 12,
      size: 120,
      fillColor: 0x000000,
      borderColor: 0xffffff,
    });
    this.nextPreview = new NextPreview(this, 0, 0, {
      borderThickness: 12,
      width: GameScene.BLOCKSIZE * 4,
      height: GameScene.BLOCKSIZE * 10,
      fillColor: 0x000000,
      fillAlpha: 1,
      borderColor: 0xffffff,
    });
    this.createPauseOverlay();
    this.setUpKeyboardControls();

    AudioBus.PlayMusic(this, "track1", { loop: true });

    // Create a decorator list dependent from the game mode
    this.createDecorators(DefaultGameModeDecorators[this.gameMode]);

    this.holdBox.setPosition(this.gridOffsetX - 120, this.gridOffsetY);
    this.nextPreview.setPosition(
      this.gridOffsetX + 30 + GameScene.totalGridWidth,
      this.gridOffsetY + 6
    );

    this.countdown = new CountdownOverlay(this);
    this.renderNextQueue();
    // When the countdown starts, the round phase changes from idle to countdown
    this.phase = RoundPhase.Countdown;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onSceneShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.onSceneShutdown, this);

    this.countdown.start({
      from: 3,
      beepSoundKey: "countdownTick",
      onFinished: () => {
        this.startRound();
      },
    });
  }

  private onSceneShutdown<GameScene>(
    SHUTDOWN: string,
    onSceneShutdown: any,
    arg2: this
  ) {
    console.log("Shutting down game scene: ", SHUTDOWN);
    this.music?.stop();
    this.music?.destroy();
    this.timer?.stop();
  }

  /**
   * Creates and adds decorators to the game scene.
   * These are TextBoxes and TimerDisplays that show game information
   * and they are created based on the provided list of decorator names.
   * This way each game mode can show different decorators as needed.
   */
  public createDecorators(decorators: string[]) {
    let lastRef: Decorators.TextBox | Decorators.LineClearCountdown | null =
      null; // Reference to the last created decorator for alignment
    let prevRef: Decorators.TextBox | Decorators.LineClearCountdown | null =
      null; // Reference to the previous decorator for alignment

    // Reset decorator references
    this.timer?.destroy();
    this.timer = null;
    this.levelText?.destroy();
    this.levelText = null;
    this.scoreText?.destroy();
    this.scoreText = null;
    this.linesText?.destroy();
    this.linesText = null;
    this.linesCountdown?.destroy();
    this.linesCountdown = null;

    // Sanitize decorators list, each entry should be unique
    decorators = Array.from(new Set(decorators));

    decorators.forEach((dec) => {
      switch (dec) {
        case "TimerDisplay":
          this.timer = new Decorators.TimerDisplay(this, {
            name: "gameTimer",
            x: 0,
            y: 0,
            width: 300,
            height: 40,
            text: "",
            prefix: "TIME ",
            textStyle: TEXTBOX_DEFAULT_STYLE,
            fillColor: "#aaaaaa",
            stroke: "#000000",
            strokeThickness: 2,
            shadow: true,
            useLinearBackground: true,
            autostart: false,
          });
          this.timer.Padding = 25;
          this.add.existing(this.timer);
          prevRef = lastRef;
          lastRef = this.timer;
          break;
        case "LinesClearedDisplay":
          this.linesText = this.add.existing(
            new TextBox(this, {
              name: "linesTextBox",
              x: 0,
              y: 0,
              width: 300,
              height: 40,
              text: "LINES: 0",
              textStyle: TEXTBOX_DEFAULT_STYLE,
              shadow: true,
              fillColor: "#aaaaaa",
              useLinearBackground: true,
            })
          );
          this.linesText.Padding = 25;
          prevRef = lastRef;
          lastRef = this.linesText;
          break;
        case "ScoreDisplay":
          this.scoreText = this.add.existing(
            new TextBox(this, {
              name: "scoreTextBox",
              x: 0,
              y: 0,
              width: 300,
              height: 40,
              shadow: true,
              text: `${t("labels.score")}: 0`,
              textStyle: TEXTBOX_DEFAULT_STYLE,
              fillColor: "#aaaaaa",
              useLinearBackground: true,
            })
          );
          this.scoreText.Padding = 25;
          prevRef = lastRef;
          lastRef = this.scoreText;
          break;
        case "LevelDisplay":
          this.levelText = this.add.existing(
            new TextBox(this, {
              name: "levelTextBox",
              x: 0,
              y: 0,
              width: 300,
              height: 40,
              shadow: true,
              text: `${t("labels.level")}: 1 (${t(
                "gravity"
              )} ${this.fallSpeed.toFixed(2)})`,
              textStyle: TEXTBOX_DEFAULT_STYLE,
              fillColor: "#aaaaaa",
              useLinearBackground: true,
            })
          );
          this.levelText.Padding = 25;
          prevRef = lastRef;
          lastRef = this.levelText;
          break;
        case "TargetLineClearsDisplay":
          this.linesCountdown = new LineClearCountdown(this, {
            x: this.gridOffsetX + GameScene.totalGridWidth / 2,
            y: this.gridOffsetY + GameScene.totalGridHeight / 3,
            limit: 40,
            textStyle: DEFAULT_FONT_STYLE,
          });
          prevRef = lastRef;
          lastRef = this.linesCountdown;
          const gridRect = new Phaser.Geom.Rectangle(
            this.gridOffsetX,
            this.gridOffsetY,
            GameScene.totalGridWidth,
            GameScene.totalGridHeight
          );
          this.linesCountdown.setTextStyle({
            fontStyle: "700",
            color: "#ffffff",
            align: "center",
          });
          this.linesCountdown.TextObject.setAlpha(0.15);
          this.linesCountdown.TextObject.setStroke("#000000", 10);
          this.linesCountdown.TextObject.setShadow(
            0,
            4,
            "#000000",
            8,
            true,
            true
          );
          this.linesCountdown.fitIntoRect(gridRect, {
            padding: 8,
            minFontSize: 18,
            maxFontSize: 200,
          });
          break;
        default:
          break;
      }

      if (lastRef === null) return;
      // Align decorators to bottom-left in order
      if (prevRef === null) {
        // Placing the first decorator
        lastRef.setPosition(
          this.gridOffsetX + GameScene.gridWidth * GameScene.BLOCKSIZE + 32,
          this.gridOffsetY + GameScene.BLOCKSIZE * 10 + 20
        );
      } else {
        if (lastRef.UseAutoAlign) {
          Display.Align.To.BottomLeft(
            lastRef,
            prevRef,
            0,
            lastRef.ActualRenderHeight + 8
          );
        }
      }
    });

    // Align the combo text to the last decorator
    Display.Align.To.BottomLeft(
      this.comboText,
      lastRef!,
      0,
      this.comboText.displayHeight + 25
    );
  }

  private setUpKeyboardControls() {
    if (!this.input?.keyboard) return;

    this.keys = {
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      hardDrop: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      softDrop: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      rotateLeft: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y),
      rotateRight: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      rotate180: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      hold: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      pause: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      resetRound: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
    };

    // TODO: Refactor to use the key objects instead of global events
    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.isPaused || this.phase !== RoundPhase.Running) return;
      this.holdTetrimino();
    });

    this.input.keyboard.on("keydown-P", () => {
      if (!this.isPaused || !this.countdown.Paused) {
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
        if (this.phase !== RoundPhase.Running) return;
        this.hardDrop();
      }
    });

    this.input.keyboard.on("keydown-DOWN", () => {
      if (this.isPaused) {
        this.pauseIndex = (this.pauseIndex + 1) % 2;
        this.updatePauseHighlight();
      }
    });

    this.input.keyboard.on("keydown-ENTER", () => {
      if (!this.isPaused) return;
      if (this.pauseIndex === 0) {
        // Resuming game from pause menu
        this.resumeGame();
      } else {
        // Going back to main menu while pause
        const data: GameSceneConfiguration = {
          gameMode: this.gameMode,
        };
        this.scene.start("MainMenuScene", data);
      }
    });

    this.input.keyboard.on("keydown-Y", () => {
      if (this.isPaused || this.phase !== RoundPhase.Running) return;
      this.rotateTetrimino("left");
      this.resetLockDelay();
    });

    this.input.keyboard.on("keydown-X", () => {
      if (this.isPaused || this.phase !== RoundPhase.Running) return;
      this.rotateTetrimino("right");
      this.resetLockDelay();
    });
  }

  private resetLockDelay(): void {
    if (!this.isLocking) return;

    if (this.lockResets < this.maxLockResets) {
      this.lockTimer = 0;
      this.lockResets++;
      console.log(
        `Lock delay reset (${this.lockResets}/${this.maxLockResets})`
      );
      console.log("Lock timer: ", this.lockTimer);
    } else {
      console.log("Lock reset limit reached - forcing lock");
    }
  }

  private handleMovement(time: number, delta: number): void {
    if (this.phase !== RoundPhase.Running) return;
    const leftJustPressed = Phaser.Input.Keyboard.JustDown(this.keys.left);
    const rightJustPressed = Phaser.Input.Keyboard.JustDown(this.keys.right);

    if (leftJustPressed) {
      this.moveTetrimino(-1);
      this.resetLockDelay();
      this.movementState.left.dasTimer = time + this.DAS;
      this.movementState.left.arrTimer = 0;
      this.movementState.left.held = true;
      this.movementState.right.held = false;
    } else if (rightJustPressed) {
      this.moveTetrimino(1);
      this.resetLockDelay();
      this.movementState.right.dasTimer = time + this.DAS;
      this.movementState.right.arrTimer = 0;
      this.movementState.right.held = true;
      this.movementState.left.held = false;
    }

    // <-- DAS/ARR for left
    if (this.keys.left.isDown && this.movementState.left.held) {
      if (time >= this.movementState.left.dasTimer) {
        if (this.ARR === 0) {
          // <-- Instant ARR (0ms)
          while (!this.checkCollision(-1, 0, this.currentShape)) {
            this.moveTetrimino(-1);
          }
        } else if (time >= this.movementState.left.arrTimer) {
          this.moveTetrimino(-1);
          this.resetLockDelay();
          this.movementState.left.arrTimer = time + this.ARR;
        }
      }
    } else if (this.keys.left.isUp) {
      this.movementState.left.held = false;
    }

    // <-- DAS/ARR for right
    if (this.keys.right.isDown && this.movementState.right.held) {
      if (time >= this.movementState.right.dasTimer) {
        if (this.ARR === 0) {
          // <-- Instant ARR (0ms)
          while (!this.checkCollision(1, 0, this.currentShape)) {
            this.moveTetrimino(1);
          }
        } else if (time >= this.movementState.right.arrTimer) {
          this.moveTetrimino(1);
          this.resetLockDelay();
          this.movementState.right.arrTimer = time + this.ARR;
        }
      }
    } else if (this.keys.right.isUp) {
      this.movementState.right.held = false;
    }
  }

  private handleSoftDrop(delta: number): void {
    if (this.keys.down.isDown && this.phase === RoundPhase.Running) {
      // Soft Drop: Instant fall with SDF speed
      const cellsToFall = this.SDF * (delta / 1000);
      let remainingFall = cellsToFall;

      while (remainingFall > 0) {
        if (!this.checkCollision(0, 1, this.currentShape)) {
          this.currentPosition.y += 1;
          remainingFall -= 1;
          this.fallProgress = 0; // <-- Reset fall progress
          this.score += 1; // <-- Soft Drop Score Bonus

          if (this.isLocking) {
            console.log("Soft drop - CANCELING lock delay");
            this.isLocking = false;
            this.lockTimer = 0;
            this.lockResets = 0;
          }
        } else {
          console.log("Soft drop collision detected!");
          // if (!this.isLocking) {
          //   console.log("STARTING LOCK DELAY (from soft drop)");
          //   this.isLocking = true;
          //   this.lockTimer = 0;
          // }
          this.checkGroundedState();
          break;
        }
      }
      this.updateTetriminoPosition();
    }
  }

  private handleGravity(delta: number): void {
    if (this.phase !== RoundPhase.Running) return;

    if (this.keys.down.isDown) {
      return; // Soft drop takes precedence over gravity
    }

    const effectiveFallSpeed = this.fallSpeed;
    this.fallProgress += effectiveFallSpeed * (delta / 1000);

    while (this.fallProgress >= 1) {
      if (!this.checkCollision(0, 1, this.currentShape)) {
        this.currentPosition.y += 1;
        this.fallProgress -= 1.0;
        console.log("Piece moved down one cell");

        if (this.isLocking) {
          console.log("Piece is falling again - CANCELING lock delay");
          this.isLocking = false;
          this.lockTimer = 0;
          this.lockResets = 0;
          this.totalLockTime = 0;
        }
      } else {
        console.log("Collision detected at bottom!");
        this.fallProgress = 0;
        this.checkGroundedState();
        break;
      }
    }

    if (this.fallProgress < 1) {
      this.checkGroundedState();
    }
  }

  private handleLockDelay(delta: number): void {
    if (this.isLocking) {
      this.lockTimer += delta;
      this.totalLockTime += delta;
      console.log(
        `Lock timer: ${this.lockTimer.toFixed(0)}ms / ${
          this.lockDelay
        }ms (resets: ${this.lockResets})`
      );
      if (
        this.lockTimer >= this.lockDelay ||
        this.totalLockTime >= this.maxLockTime
      ) {
        this.lockTetrimino();
        this.isLocking = false;
        this.lockTimer = 0;
        this.lockResets = 0;
        this.totalLockTime = 0;
      }
    }
  }

  private pauseGame(): void {
    this.backgroundVideo?.pause();
    this.timer?.pause();
    this.countdown.Paused = true;
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
    this.backgroundVideo?.resume();
    this.sakuraEmitter.killAll();
    this.sakuraEmitter.setActive(false);
    this.tweens.add({
      targets: this.pauseContainer,
      alpha: 0,
      duration: 250,
      ease: "Sine.easeOut",
    });
    this.countdown.Paused = false;
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

  private createGridGraphics(configuration: GridConfiguration): void {
    this.borderThickness = configuration?.borderThickness ?? 10;

    // Add grid background and border
    this.add
      .rectangle(
        this.gridOffsetX,
        this.gridOffsetY,
        GameScene.gridWidth * GameScene.BLOCKSIZE + this.borderThickness,
        GameScene.gridHeight * GameScene.BLOCKSIZE + this.borderThickness,
        0xffffff,
        1.0
      )
      .setOrigin(0);
    // Add grid cells
    this.gridCellGroup = this.add.group({
      key: "gridCell",
      quantity: 10 * 20, // Rows * Columns elements,
      "setAlpha.value": configuration.gridOpacity,
      gridAlign: {
        x: this.gridOffsetX + this.borderThickness / 2,
        y: this.gridOffsetY + this.borderThickness / 2,
        cellWidth: GameScene.BLOCKSIZE,
        cellHeight: GameScene.BLOCKSIZE,
        width: GameScene.gridWidth,
        height: GameScene.gridHeight,
      },
    });
  }

  private spawnHeldTetrimino(): void {
    this.currentRotationIndex = 0;
    this.currentShape = SHAPES[this.currentTetriminoType][0];
    this.currentPosition = { x: 3, y: -1 };

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

    this.currentShape?.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const blockX =
            (this.currentPosition.x + x) * GameScene.BLOCKSIZE +
            this.gridOffsetX +
            this.borderThickness / 2;
          const blockY =
            (this.currentPosition.y + y) * GameScene.BLOCKSIZE +
            this.gridOffsetY +
            this.borderThickness / 2;

          const frame = SHAPE_TO_BLOCKSKIN_FRAME[this.currentTetriminoType];
          const block = this.add.sprite(blockX, blockY, this._blockSkin, frame);
          block.setDisplaySize(GameScene.BLOCKSIZE, GameScene.BLOCKSIZE);
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

    // Spawn pieces above the visible grid
    this.currentPosition = { x: 3, y: -1 };

    this.renderNextQueue();
    this.createTetriminoBlocks();
    this.updateGhost();

    if (this.checkCollision(0, 0, this.currentShape)) {
      this.handleGameOver();
      return;
    }
  }

  private holdTetrimino(): void {
    // TODO: Introduce a gameplay rule option to allow multiple holds per turn
    if (this.holdUsedThisTurn) return;

    this.holdUsedThisTurn = true;
    this.currentTetrimino?.clear(true, true);

    if (this._holdType) {
      console.debug("Swapping current piece with hold piece");
      const temp = this.currentTetriminoType;
      this.currentTetriminoType = this._holdType;
      this._holdType = temp;
      this.spawnHeldTetrimino();
    } else {
      console.debug("Holding current piece and spawn new piece");
      this._holdType = this.currentTetriminoType;
      this.spawnTetrimino();
    }

    AudioBus.PlaySfx(this, "hold");
    this.holdBox?.renderHold();
  }

  private renderNextQueue(): void {
    this.previewGroup?.clear(true, true);

    const previewBoxHeight = GameScene.BLOCKSIZE * 10;
    const tetriminoHeight = GameScene.BLOCKSIZE * 2;
    const previewContentHeight = GameScene.previewSize * tetriminoHeight;
    const startX =
      this.gridOffsetX + GameScene.gridWidth * GameScene.BLOCKSIZE + 32;

    const adjustedStartY =
      this.gridOffsetY +
      (previewBoxHeight - previewContentHeight) / 2 -
      GameScene.BLOCKSIZE;

    this.spawner.NextQueue.slice(0, GameScene.previewSize).forEach(
      (type, index) => {
        const shape = SHAPES[type][0];
        const cols = shape[0].length;
        const rows = shape.length;

        const offsetX =
          (GameScene.BLOCKSIZE * 4 - cols * (GameScene.BLOCKSIZE / 2)) / 2;
        const offsetY =
          (GameScene.BLOCKSIZE * 4 - rows * (GameScene.BLOCKSIZE / 2)) / 2;

        const previewX = startX + offsetX;
        const previewY =
          adjustedStartY + index * GameScene.BLOCKSIZE * 2 + offsetY;

        shape.forEach((row, y) => {
          row.forEach((cell, x) => {
            if (cell) {
              const block = this.add
                .sprite(
                  previewX + x * (GameScene.BLOCKSIZE / 2),
                  previewY + y * (GameScene.BLOCKSIZE / 2),
                  this._blockSkin,
                  SHAPE_TO_BLOCKSKIN_FRAME[type]
                )
                .setOrigin(0)
                .setDisplaySize(
                  GameScene.BLOCKSIZE / 2,
                  GameScene.BLOCKSIZE / 2
                );

              this.previewGroup.add(block);
            }
          });
        });
      }
    );
    this.previewGroup.setDepth(500);
    this.nextPreview?.centerGroupInBox(this.previewGroup);
  }

  private moveTetrimino(direction: number): void {
    if (this.checkCollision(direction, 0)) return;

    this.currentPosition.x += direction;
    this.updateTetriminoPosition();
    this.updateGhost();

    this.checkGroundedState();

    AudioBus.PlaySfx(this, "move");
  }

  private checkGroundedState(): void {
    const isGrounded = this.checkCollision(0, 1, this.currentShape);

    if (isGrounded) {
      if (!this.isLocking) {
        console.log(
          "Piece grounded after movement/rotation - STARTING LOCK DELAY"
        );
        this.isLocking = true;
        this.lockTimer = 0;
      } else {
        console.log("Piece still grounded - lock delay continues");
      }
    } else {
      if (this.isLocking) {
        console.log("Piece no longer grounded - CANCELING LOCK DELAY");
        this.isLocking = false;
        this.lockTimer = 0;
        this.lockResets = 0;
        this.totalLockTime = 0;
      }
    }
  }

  private updateGhost(): void {
    const frame = SHAPE_TO_BLOCKSKIN_FRAME[this.currentTetriminoType];
    this.ghostGroup?.clear(true, true);
    this.ghostGroup = this.add.group();

    let ghostY = this.currentPosition.y;
    while (!this.checkCollision(0, ghostY - this.currentPosition.y + 1)) {
      ghostY++;
    }

    this.currentShape?.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const posX =
            (this.currentPosition.x + x) * GameScene.BLOCKSIZE +
            this.gridOffsetX +
            this.borderThickness / 2;
          const posY =
            (ghostY + y) * GameScene.BLOCKSIZE +
            this.gridOffsetY +
            this.borderThickness / 2;

          const block = this.add
            .sprite(posX, posY, this._blockSkin, frame)
            .setAlpha(0.3)
            .setOrigin(0)
            .setDisplaySize(GameScene.BLOCKSIZE, GameScene.BLOCKSIZE);

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

        this.checkGroundedState();

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
    let dropDistance = 0;

    while (!this.checkCollision(0, 1, this.currentShape)) {
      this.currentPosition.y += 1;
      dropDistance++;
    }

    this.score += dropDistance * 2; // Hard Drop Score: 2 points per cell
    console.log(this.scoreText);

    this.scoreText?.setText(`Score: ${this.score}`);
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

    return (
      shape?.some((row, y) => {
        return row?.some((cell, x) => {
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
      }) ?? false
    );
  }

  private updateTetriminoPosition(): void {
    const landed = this.checkCollision(0, 1, this.currentShape);
    const useFraction = !landed;
    const baseY =
      this.currentPosition.y + (useFraction ? this.fallProgress : 0);
    const blockSize = GameScene.BLOCKSIZE;
    let blockIndex = 0;
    this.currentShape?.forEach((row, y) => {
      row?.forEach((cell, x) => {
        if (cell) {
          const blockX =
            (this.currentPosition.x + x) * blockSize +
            this.gridOffsetX +
            this.borderThickness / 2;
          const blockY =
            (baseY + y) * GameScene.BLOCKSIZE +
            this.gridOffsetY +
            this.borderThickness / 2;
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

    this.currentShape?.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const gridX = this.currentPosition.x + x;
          const gridY = this.currentPosition.y + y;
          if (gridY >= 0 && gridY < GameScene.gridHeight) {
            this.grid[gridY][gridX] = this.currentTetriminoType;
          }
        }
      });
    });

    this.currentTetrimino.clear(true, true);
    this.checkAndClearLines();
    this.drawLockedBlocks();

    // Reset lock delay variables when spawning a new piece
    this.isLocking = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.totalLockTime = 0;

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
              x * GameScene.BLOCKSIZE +
                this.gridOffsetX +
                this.borderThickness / 2,
              y * GameScene.BLOCKSIZE +
                this.gridOffsetY +
                this.borderThickness / 2,
              this._blockSkin,
              this.getOriginalSkinFrame(cell)
            )
            .setOrigin(0)
            .setDisplaySize(GameScene.BLOCKSIZE, GameScene.BLOCKSIZE);

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
        const offset = GameScene.BLOCKSIZE / 2;
        for (let x = 0; x < GameScene.gridWidth; x++) {
          const posX = this.gridOffsetX + x * GameScene.BLOCKSIZE + offset;
          const posY = (y + 1) * GameScene.BLOCKSIZE + offset;
          this.particleManager.emitParticleAt(posX, posY);
        }
        this.clearLine(y);
        clearedLinesCount++;
        y++;
      }
    }

    if (clearedLinesCount > 0) {
      this.linesCleared += clearedLinesCount;
      this.linesCountdown?.applyLineClears(clearedLinesCount);
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
        this.levelText?.setText(
          `${t("labels.level")}: ${this.level} (${t(
            "gravity"
          )} ${this.fallSpeed.toFixed(2)})`
        );
      }
      this.linesText?.setText(`${t("labels.lines")}: ${this.linesCleared}`);
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

  private checkAscentWin() {
    if (this.linesCleared >= 150) {
      LogGameAction(GameActions.ASCENT_VICTORY);
      this.triggerVictory();
    }
  }

  private checkRushWin() {
    if (this.linesCleared >= 40) {
      LogGameAction(GameActions.RUSH_VICTORY);
      this.triggerVictory();
    }
  }

  private triggerVictory(): void {
    const sceneData: VictorySceneData = {
      score: this.score,
      gameMode: this.gameMode,
      time: this.timer?.getElapsedMs() ?? 0,
      linesCleared: this.linesCleared,
    };
    this.gameOver = true;
    this.scene.start("VictoryScene", sceneData);
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

    this.scoreText?.setText(`Score: ${this.score}`);
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
    if (this.gameMode === GameMode.INFINITY) {
      this.triggerVictory();
    } else {
      this.scene.start("GameOverScene", { gameMode: this.gameMode });
    }
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

    const resetRoundJustPressed = Phaser.Input.Keyboard.JustDown(
      this.keys.resetRound
    );

    if (resetRoundJustPressed) {
      this.resetRound();
      return;
    }

    if (!this.isPaused && !this.gameOver) {
      this.handleMovement(time, delta);
      this.handleSoftDrop(delta);
      this.handleGravity(delta);
      this.handleLockDelay(delta);
      this.updateTetriminoPosition();
      this.updateLockDelayVisual();
    }
  }

  private applyInputSettings() {
    this.DAS = InputSettings.DAS;
    this.ARR = InputSettings.ARR;
    this.SDF = InputSettings.SDF;
    this.resetAutoRepeat();
  }

  private resetAutoRepeat() {
    this.movementState.left.dasTimer = 0;
    this.movementState.left.arrTimer = 0;
    this.movementState.left.held = false;
    this.movementState.right.dasTimer = 0;
    this.movementState.right.arrTimer = 0;
    this.movementState.right.held = false;
  }

  private updateLockDelayVisual(): void {
    if (!this.isLocking || !this.currentTetrimino) {
      // If not locking, clear any visual lock delay indicators
      this.currentTetrimino.getChildren().forEach((block) => {
        const sprite = block as Phaser.GameObjects.Sprite;
        sprite.clearTint();
      });
      return;
    }

    const lockProgress = Math.min(this.lockTimer / this.lockDelay, 1.0);
    const redValue = 255;
    const greenBlueValue = Math.floor(255 * (1 - lockProgress));
    const tintColor = (redValue << 16) | (greenBlueValue << 8) | greenBlueValue;

    this.currentTetrimino.getChildren().forEach((block) => {
      const sprite = block as Phaser.GameObjects.Sprite;
      sprite.setTint(tintColor);
    });
  }

  private resetRound() {
    this.grid = [];
    this.lockedBlocksGroup.clear(true, true);
    this.initializeGrid();
    this.score = 0;
    this.scoreText?.setText(`Score: ${this.score}`);
    this.linesCleared = 0;
    this.linesText?.setText(`${t("labels.lines")}: ${this.linesCleared}`);
    this.level = 1;
    this.levelText?.setText(`${t("labels.level")}: ${this.level}`);
    this.linesCountdown?.reset();
    this.spawner.emptyQueue();
    this.spawner.generateNextQueue(5);
    this.renderNextQueue();
    this._holdType = null;
    this.holdBox?.renderHold();
    this.currentTetrimino?.clear(true, true);
    this.currentShape = null;
    this.ghostGroup?.clear(true, true);
    this.isLocking = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.totalLockTime = 0;
    this.holdUsedThisTurn = false;
    this._main?.flash(250, 255, 255, 255);
    this.phase = RoundPhase.Countdown;
    this.resumeGame();
    this.timer?.reset();
    this.countdown.start({
      from: 3,
      beepSoundKey: "countdownTick",
      onFinished: () => {
        this.startRound();
      },
    });
  }

  /**
   * Callback used by the countdown overlay, don't call directly.
   */
  private startRound() {
    this.isPaused = false;
    this.countdown.stop();
    const s = this.sound.get("countdownGo");
    if (s?.isPlaying) s.stop();
    this.sound.play("countdownGo", { volume: 1 });

    switch (this.phase) {
      case RoundPhase.Running:
        // Resuming from pause
        this.timer?.resume();
        break;
      default:
        // Starting a new round after countdown or if phase is unknown
        this.phase = RoundPhase.Running;
        this.timer?.start();
        this.spawnTetrimino();
        break;
    }
  }
}
