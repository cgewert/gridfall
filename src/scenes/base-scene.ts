export class BaseScene extends Phaser.Scene {
  protected _main: Phaser.Cameras.Scene2D.Camera | null = null;
  protected _viewPortWidth: number = 0;
  protected _viewPortHeight: number = 0;
  protected _viewPortHalfWidth: number = 0;
  protected _viewPortHalfHeight: number = 0;

  public constructor(cfg: Phaser.Types.Scenes.SettingsConfig) {
    super(cfg);
  }
}
