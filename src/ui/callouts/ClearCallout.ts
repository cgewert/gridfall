export abstract class ClearCallout {
  constructor(protected scene: Phaser.Scene) {
    this.init();
  }

  protected abstract init(): void;
  public abstract show(props: any): void;
}
