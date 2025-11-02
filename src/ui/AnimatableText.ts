export type AnimatableTextOptions = {
  x?: number;
  y?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  stroke?: string;
  strokeThickness?: number;
  shadow?: boolean;
  alpha?: number;
  depth?: number;
  align?: "left" | "center" | "right";
};

export enum AnimatableTextTweenType {
  PULSE,
  SCALE,
}

export class AnimatableText extends Phaser.GameObjects.Container {
  private _text!: Phaser.GameObjects.Text;
  private _scene!: Phaser.Scene;
  private _animationTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, opts: AnimatableTextOptions = {}) {
    const x = opts.x ?? 0;
    const y = opts.y ?? 0;

    super(scene, x, y);
    this._scene = scene;

    this._text = this._scene.make.text(
      {
        x: 0,
        y: 0,
        text: opts.text ?? "",
        style: {
          fontFamily: opts.fontFamily ?? "Orbitron, monospace",
          fontSize: `${opts.fontSize ?? 32}px`,
          color: opts.color ?? "#FFFFFF",
          align: opts.align ?? "left",
        },
      },
      false
    );

    if (opts.stroke) {
      this._text.setStroke(opts.stroke, opts.strokeThickness ?? 2);
    }
    if (opts.shadow) {
      this._text.setShadow(0, 2, "#000000", 4, true, true);
    }
    this._text.setOrigin(0.5, 0.5);
    this.add(this._text);

    if (opts.alpha !== undefined) this.setAlpha(opts.alpha);
    if (opts.depth !== undefined) this.setDepth(opts.depth);

    scene.add.existing(this);

    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy);
  }

  /**
   * Callback for scene update event.
   */
  private onUpdate(): void {}

  public startAnimation(type: AnimatableTextTweenType): void {
    if (this._animationTween) {
      this._animationTween.stop();
      this._animationTween?.seek(0);
      this._animationTween.destroy();
      this._animationTween = undefined;
    }

    switch (type) {
      case AnimatableTextTweenType.PULSE:
        this._animationTween = this._scene.tweens.add({
          targets: this._text,
          alpha: { from: 0, to: 1 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;
      case AnimatableTextTweenType.SCALE:
        this._animationTween = this._scene.tweens.add({
          targets: this._text,
          scale: { from: 1, to: 1.2 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        break;
      default:
        break;
    }
  }

  public stopAnimation(): void {
    this._animationTween?.stop();
    this._animationTween?.seek(0);
    this._animationTween?.destroy();
    this._animationTween = undefined;
  }

  public pauseAnimation(): void {
    this._animationTween?.pause();
  }

  public resumeAnimation(): void {
    this._animationTween?.resume();
  }

  /**
   * Callback for game object destroy event.
   */
  private onDestroy(): void {
    console.log("Removing animatable text");
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this._text.destroy();
    this._animationTween?.stop();
    this._animationTween?.seek(0);
    this._animationTween?.destroy();
  }
}
