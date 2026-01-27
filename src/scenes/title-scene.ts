import { Soundtrack } from "../audio";
import { addSceneBackground } from "../effects/effects";
import * as Phaser from "phaser";
import { TITLE_FONT_STYLE } from "../fonts";
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
  private bgCross!: Phaser.GameObjects.Image;
  private logo!: Phaser.GameObjects.Image;

  constructor() {
    super(TitleScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: unknown) {}

  public preload() {
    this.load.audio("title_music", Soundtrack.title);
    this.load.image("title_logo", "assets/gfx/logos/Gridfall.png");
    this.load.image("gridCell", "assets/gfx/sprites/grid_cell.png");
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: unknown) {
    const { width: w, height: h } = this.scale;
    this._main = this.cameras.main;
    this._main.setBackgroundColor("#000000");

    // If the audio settings were not saved previously, create a local storage entry.
    if (!AudioSettings.HasSettings) AudioSettings.save();
    // Load local storage settings as early as possible.
    AudioSettings.load();

    this.sound.pauseOnBlur = false;
    if (this.sound.locked) {
      this.sound.once("unlocked", () => this.startAudioVis());
    } else {
      this.startAudioVis();
    }

    this.music = AudioBus.AddSceneAudio(this, "title_music", { loop: true });
    AudioBus.PlayMusic(this, "title_music");

    addSceneBackground(this);

    this.ensureCrossTexture("bgCrossTex", 420);
    this.bgCross = this.add.image(-200, h * 0.45, "bgCrossTex");
    this.bgCross.setAlpha(0.18);
    this.bgCross.setDepth(0);
    this.bgCross.setScale(1.0);
    this.addTitle(w, h);
    this.addPressKeyPrompt();
    const logoTargetX = w * 0.5;
    const logoTargetY = h * 0.32;
    const crossTargetX = logoTargetX;
    const crossTargetY = logoTargetY + this.logo.displayHeight * 0.05;
    const chain1 = this.tweens.chain({
      targets: this.bgCross,
      persist: true,
      tweens: [
        {
          x: crossTargetX,
          y: crossTargetY,
          angle: 20,
          duration: 700,
          ease: "Cubic.easeOut",
        },
        {
          angle: 12,
          duration: 220,
          yoyo: true,
          ease: "Sine.easeInOut",
        },
      ],
    });
    const chain2 = this.tweens.chain({
      targets: this.logo,
      persist: true,
      tweens: [
        {
          x: logoTargetX,
          y: logoTargetY,
          duration: 750,
          ease: "Back.easeOut",
        },
        {
          y: logoTargetY + 6,
          duration: 180,
          yoyo: true,
          ease: "Sine.easeInOut",
        },
      ],
    });
    let pending = 2;
    const done = () => {
      pending--;
      if (pending === 0) this.startCrossIdleMotion();
    };
    chain1.setCallback("onComplete", () => done());
    chain2.setCallback("onComplete", () => done());
    chain1.play();
    chain2.play();
    this.addStartInputListener();
  }

  private startAudioVis() {
    const analyser = CreateAudioAnalysis(this);
    if (analyser) this.audioAnalyser = analyser;
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioAnalyser?.disconnect && this.audioAnalyser.disconnect();
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

  private addTitle(w: number, h: number): void {
    this.logo = this.add.image(w + 200, -120, "title_logo");
    this.logo.setAlpha(0.9).setDepth(10);
    const targetLogoWidth = w * 0.42;
    const logoScale = targetLogoWidth / this.logo.width;
    this.logo.setScale(logoScale);
  }

  private addPressKeyPrompt(): void {
    this.pressKeyText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2 + 120,
      t("pressAnyKey").toLocaleUpperCase(),
      TITLE_FONT_STYLE,
    );
    this.pressKeyText.setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: this.pressKeyText,
      alpha: 1,
      duration: 800,
      hold: 1500,
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

  private startCrossIdleMotion() {
    const { width: w, height: h } = this.scale;

    // Sanfter Drift (Ellipse/Parallax-like)
    // Variante A: Tween zwischen zwei Punkten (yoyo), wirkt sehr ruhig
    this.tweens.add({
      targets: this.bgCross,
      // x: { from: this.bgCross.x, to: w * 0.54 },
      // y: { from: this.bgCross.y, to: h * 0.48 },
      x: `+=${w * 0.4}`, // ca. 4% der Breite nach rechts
      y: `+=${h * 0.4}`, // ca. 8% der Höhe nach unten
      duration: 10000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Langsame Rotation
    this.tweens.add({
      targets: this.bgCross,
      angle: "+=360",
      duration: 16000,
      repeat: -1,
      ease: "Linear",
    });
  }

  private ensureCrossTexture(key: string, size: number) {
    if (this.textures.exists(key)) return;

    const g = this.make.graphics({ x: 0, y: 0 });

    const fill = 0x4aa3ff;
    const alpha = 0.9;

    const center = size / 2;
    const armThickness = Math.floor(size * 0.14);
    const armLength = Math.floor(size * 0.42);
    const radius = Math.floor(armThickness * 0.45); // leicht abgerundete Ecken

    g.fillStyle(fill, alpha);

    g.fillRoundedRect(
      center - armThickness / 2,
      center - armLength,
      armThickness,
      armLength * 2,
      radius,
    );

    g.fillRoundedRect(
      center - armLength,
      center - armThickness / 2,
      armLength * 2,
      armThickness,
      radius,
    );

    g.lineStyle(Math.max(2, Math.floor(size * 0.01)), 0xffffff, 0.58);
    g.strokeRoundedRect(
      center - armThickness / 2,
      center - armLength,
      armThickness,
      armLength * 2,
      radius,
    );
    g.strokeRoundedRect(
      center - armLength,
      center - armThickness / 2,
      armLength * 2,
      armThickness,
      radius,
    );

    g.generateTexture(key, size, size);
    g.destroy();
  }
}
