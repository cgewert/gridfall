import { Soundtrack } from "../audio";
import {
  addAnimatedGridBackground,
  addSceneBackground,
} from "../effects/effects";
import * as Phaser from "phaser";
import { DEFAULT_FONT_STYLE } from "../fonts";
import { DEFAULT_COLORS } from "../colors";
import { t } from "i18next";
import { CreateAudioAnalysis } from "../game";

export class TitleScene extends Phaser.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "TitleScene",
  };

  private _main: Phaser.Cameras.Scene2D.Camera | null = null;
  private titleText!: Phaser.GameObjects.Text;
  private pressKeyText!: Phaser.GameObjects.Text;
  private music!: Phaser.Sound.BaseSound;
  private audioAnalyser?: AnalyserNode;
  private lastTime: number = 0;
  private logo: Phaser.GameObjects.Image = null!;

  constructor() {
    super(TitleScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: unknown) {}

  public preload() {
    // TODO: Load the music assets only after the game settings are implemented.
    this.load.audio("title_music", Soundtrack.track1);
    this.load.image("title_logo", "assets/gfx/logos/Gridfall.png");
    this.load.image("sparkle", "assets/gfx/particles/sparkle.png");
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: unknown) {
    this._main = this.cameras.main;
    this._main.setBackgroundColor("#000000");
    this.sound.pauseOnBlur = false;
    if (this.sound.locked) {
      this.sound.once("unlocked", () => this.startAudioVis());
    } else {
      this.startAudioVis();
    }

    this.music = this.sound.add("title_music", {
      loop: true,
      volume: 0.5,
    });
    if (!this.music.isPlaying) this.music.play();

    addSceneBackground(this);
    const bgColor = Phaser.Display.Color.ValueToColor(
      DEFAULT_COLORS[Phaser.Math.Between(0, 6)]
    );
    addAnimatedGridBackground(this, 40, 20, bgColor);
    this.addTitle();
    this.addPressKeyPrompt();
    this.addStartInputListener();
  }

  private startAudioVis() {
    const { analyser, disconnect } = CreateAudioAnalysis(this);
    console.log("Analyser:", analyser);
    if (analyser) this.audioAnalyser = analyser;
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      disconnect && disconnect();
    });
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    if (time - this.lastTime >= 50) {
      this.lastTime = time;
      if (this.audioAnalyser) {
        const data = this.getAudioData(this.audioAnalyser);
        const bass = data.slice(0, 24).reduce((a, b) => a + b, 0) / (24 * 255);
        const scale = 1 + bass * 0.16;
        this.logo.setScale(scale);
        //this.cameras.main.setZoom(1 + bass * 0.02);
      }
    }
  }

  private addTitle(): void {
    const logo = this.add.image(
      this.scale.width / 2,
      this.scale.height / 2 - 100,
      "title_logo"
    );
    logo.setScale(0.5).setAlpha(0.9);
    this.logo = logo;

    // this.tweens.add({
    //   targets: logo,
    //   scale: { from: 0.5, to: 0.4 },
    //   duration: 3100,
    //   ease: "Sine.easeInOut",
    //   yoyo: true,
    //   repeat: -1,
    //   delay: 700,
    // });

    const ellipse = new Phaser.Curves.Ellipse(
      0,
      0,
      logo.displayWidth * 0.8,
      logo.displayHeight * 0.9
    );

    // this.add.particles(logo.x, logo.y, "sparkle", {
    //   lifespan: 3000,
    //   scale: { start: 0.5, end: 0 },
    //   alpha: { start: 1, end: 0 },
    //   frequency: 100,
    //   emitZone: {
    //     type: "edge",
    //     source: ellipse,
    //     quantity: 50,
    //     yoyo: false,
    //   },
    // });
  }

  private addPressKeyPrompt(): void {
    this.pressKeyText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 120,
      t("pressAnyKey"),
      DEFAULT_FONT_STYLE
    );
    this.pressKeyText.setOrigin(0.5);

    this.tweens.add({
      targets: this.pressKeyText,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private addStartInputListener(): void {
    if (this.input?.keyboard) {
      this.input.keyboard.once("keydown", () => {
        this.music.stop();
        this.sound.stopAll();
        this.scene.start("MainMenuScene");
      });
    } else {
      throw new Error("Keyboard input not available.");
    }
  }

  private getAudioData(analyser: AnalyserNode): Uint8Array {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data;
  }
}
