import { BaseScene } from "./base-scene";

export class TitleScene extends BaseScene {
  private static CONFIG: Phaser.Types.Scenes.SettingsConfig = {
    key: "TitleScene",
  };

  private titleText!: Phaser.GameObjects.Text;
  private pressKeyText!: Phaser.GameObjects.Text;
  private music!: Phaser.Sound.BaseSound;

  constructor() {
    super(TitleScene.CONFIG);
  }

  /* Scene initialization logic. */
  public init(data: unknown) {}

  public preload() {
    this.load.audio("title_music", "assets/audio/music/stack-to-win.mp3");
    this.load.image("title_logo", "assets/gfx/Gridfall.png");
  }

  /*
   * @param data - Custom data provided to the scene.
   */
  public create(data: unknown) {
    this._main = this.cameras.main;
    this._viewPortHalfHeight = this._main.height / 2;
    this._viewPortHalfWidth = this._main.width / 2;
    this._viewPortHeight = this._main.height;
    this._viewPortWidth = this._main.width;

    this.music = this.sound.add("title_music", {
      loop: true,
      volume: 0.5, // Lautstärke anpassbar
    });

    this.music.play();

    this.addTitle();
    this.addPressKeyPrompt();
    this.addStartInputListener();
  }

  /**
   * Updates the scene logic.
   * @param time - Overall time in ms since game started.
   * @param delta - Time in ms since last update call.
   */
  public update(time: number, delta: number) {
    // Update the game logic here.
  }

  private addTitle(): void {
    const logo = this.add.image(
      this._viewPortHalfWidth,
      this._viewPortHalfHeight - 100,
      "title_logo"
    );
    logo.setOrigin(0.5);
    logo.setScale(0.5); // falls nötig – kannst du anpassen
  }

  private addPressKeyPrompt(): void {
    this.pressKeyText = this.add.text(
      this._viewPortHalfWidth,
      this._viewPortHalfHeight + 20,
      "Press any key to start",
      {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#aaaaaa",
      }
    );
    this.pressKeyText.setOrigin(0.5);

    // Animation: sanftes Blinken per Tween
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
        // this.music.stop(); // Musik beenden
        this.scene.start("MainMenuScene");
      });
    } else {
      throw new Error("Keyboard input not available.");
    }
  }
}
