import { Soundtrack } from "../audio";
import {
  addAnimatedGridBackground,
  addScanlines,
  addSceneBackground,
} from "../effects/effects";
import * as Phaser from "phaser";
import { DEFAULT_FONT_STYLE } from "../fonts";
import { DEFAULT_COLORS } from "../colors";
import { t } from "i18next";
import { AudioAnalysis, CreateAudioAnalysis } from "../game";
import { AudioSettings } from "../services/AudioSettings";
import { AudioBus } from "../services/AudioBus";

export class TitleScene extends Phaser.Scene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "TitleScene",
  };

  private _main: Phaser.Cameras.Scene2D.Camera | null = null;
  private pressKeyText!: Phaser.GameObjects.Text;
  private music!: Phaser.Sound.BaseSound;
  private audioAnalyser?: AudioAnalysis;
  private lastTime: number = 0;
  private logo: Phaser.GameObjects.Image = null!;
  private scan?: ReturnType<typeof addScanlines>;

  constructor() {
    super(TitleScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: unknown) {}

  public preload() {
    this.load.audio("title_music", Soundtrack.title);
    this.load.image("title_logo", "assets/gfx/logos/Gridfall.png");
    this.load.image("scanlines", "assets/gfx/sprites/scanlines.png");
    this.load.image("gridCell", "assets/gfx/sprites/grid_cell.png");
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: unknown) {
    // If the audio settings were not saved previously, create a local storage entry.
    if (!AudioSettings.HasSettings) AudioSettings.save();
    // Load local storage settings as early as possible.
    AudioSettings.load();
    console.debug(
      "Loaded audio settings:",
      `Music Volume: ${AudioSettings.MusicVolume}`,
      `SFX Volume: ${AudioSettings.SfxVolume}`
    );

    this._main = this.cameras.main;
    this._main.setBackgroundColor("#000000");
    this.sound.pauseOnBlur = false;
    if (this.sound.locked) {
      this.sound.once("unlocked", () => this.startAudioVis());
    } else {
      this.startAudioVis();
    }

    this.music = AudioBus.AddSceneAudio(this, "title_music", { loop: true });
    AudioBus.PlayMusic(this, "title_music");

    addSceneBackground(this);
    const bgColor = Phaser.Display.Color.ValueToColor(
      DEFAULT_COLORS[Phaser.Math.Between(0, 6)]
    );
    addAnimatedGridBackground(this, 40, 20, bgColor);
    this.addTitle();
    this.addPressKeyPrompt();
    this.addStartInputListener();
    this.scan = addScanlines(this, {
      alpha: 0.15,
      blendMode: Phaser.BlendModes.MULTIPLY,
      speedY: 0.55,
    });
  }

  private startAudioVis() {
    const analyser = CreateAudioAnalysis(this);
    if (analyser) this.audioAnalyser = analyser;
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioAnalyser?.disconnect && this.audioAnalyser.disconnect();
      this.scan?.destroy();
    });
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    if (time - this.lastTime >= 24) {
      this.lastTime = time;
      if (this.audioAnalyser) {
        const data = this.getAudioData(this.audioAnalyser);
        const bass = data.slice(16, 32).reduce((a, b) => a + b, 0) / (16 * 255);
        const scale = 1 + bass * 0.32;
        this.logo.setScale(scale);
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

  private getAudioData(audioAnalysis: AudioAnalysis): Uint8Array {
    if (!audioAnalysis.analyser) return new Uint8Array(0);
    const data = new Uint8Array(audioAnalysis.analyser.frequencyBinCount);
    audioAnalysis.analyser.getByteFrequencyData(data);

    return data;
  }
}
