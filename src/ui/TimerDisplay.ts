import Phaser from "phaser";

export type TimerDisplayOptions = {
  x?: number;
  y?: number;
  autostart?: boolean;
  prefix?: string; // z.B. "TIME "
  fontFamily?: string; // z.B. "Orbitron"
  fontSize?: number; // px
  color?: string; // z.B. "#FFFFFF"
  stroke?: string; // Konturfarbe
  strokeThickness?: number;
  shadow?: boolean; // Textschatten für bessere Lesbarkeit
  alpha?: number;
  depth?: number;
  align?: "left" | "center" | "right";
};

export class TimerDisplay extends Phaser.GameObjects.Container {
  private text!: Phaser.GameObjects.Text;

  private running = false;
  private accumulatedMs = 0; // summierte Zeit aller Läufe
  private lastStartNow = 0; // Zeitpunkt des letzten Starts (ms, scene.time.now)
  private prefix: string;

  constructor(scene: Phaser.Scene, opts: TimerDisplayOptions = {}) {
    const x = opts.x ?? 0;
    const y = opts.y ?? 0;
    super(scene, x, y);

    this.prefix = opts.prefix ?? "";

    // Textobjekt
    this.text = scene.add.text(0, 0, this.format(0), {
      fontFamily: opts.fontFamily ?? "Orbitron, monospace",
      fontSize: `${opts.fontSize ?? 32}px`,
      color: opts.color ?? "#FFFFFF",
      align: opts.align ?? "left",
    });

    if (opts.stroke) {
      this.text.setStroke(opts.stroke, opts.strokeThickness ?? 2);
    }
    if (opts.shadow) {
      this.text.setShadow(0, 2, "#000000", 4, true, true);
    }

    this.text.setOrigin(0, 0.5); // linksbündig, vertikal mittig
    this.add(this.text);

    if (opts.alpha !== undefined) this.setAlpha(opts.alpha);
    if (opts.depth !== undefined) this.setDepth(opts.depth);

    scene.add.existing(this);

    // Auf Scene-Updates reagieren
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    });

    if (opts.autostart) this.start();
  }

  /** Startet (oder resumed) den Timer – lässt die bisher akkumulierte Zeit stehen. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastStartNow = this.scene.time.now;
  }

  /** Pausiert (hält an, aber behält die Zeit). */
  pause(): void {
    if (!this.running) return;
    const now = this.scene.time.now;
    this.accumulatedMs += now - this.lastStartNow;
    this.running = false;
    // Anzeige direkt aktualisieren
    this.text.setText(this.prefix + this.format(this.accumulatedMs));
  }

  /** Stoppt und setzt den Timer auf 0. */
  stop(): void {
    this.running = false;
    this.accumulatedMs = 0;
    this.text.setText(this.prefix + this.format(0));
  }

  /** Setzt zurück (wie stop, aber ohne Anzeige zu ändern, wenn gewünscht). */
  reset(): void {
    this.running = false;
    this.accumulatedMs = 0;
    this.text.setText(this.prefix + this.format(0));
  }

  /** Fortsetzen falls pausiert. Alias zu start(). */
  resume(): void {
    this.start();
  }

  /** Setzt die Anzeige hart auf eine bestimmte ms-Zeit (optional nützlich). */
  setElapsedMs(ms: number): void {
    const clamped = Math.max(0, ms | 0);
    this.accumulatedMs = clamped;
    if (this.running) this.lastStartNow = this.scene.time.now;
    this.text.setText(this.prefix + this.format(clamped));
  }

  /** Liefert die aktuelle verstrichene Zeit in Millisekunden. */
  getElapsedMs(): number {
    if (!this.running) return this.accumulatedMs;
    const now = this.scene.time.now;
    return this.accumulatedMs + (now - this.lastStartNow);
  }

  /** Optional: Präfix ändern (z. B. "SPRINT "). */
  setPrefix(p: string): void {
    this.prefix = p ?? "";
    // Anzeige direkt neu schreiben
    this.text.setText(this.prefix + this.format(this.getElapsedMs()));
  }

  /** Textstil auch nachträglich anpassbar. */
  setTextStyle(style: Phaser.Types.GameObjects.Text.TextStyle): void {
    this.text.setStyle(style);
  }

  /** Größe/Skalierung der gesamten Komponente wie gewohnt über setScale(). */
  override setScale(x: number, y?: number): this {
    super.setScale(x, y);
    return this;
  }

  /** Position anpassen: Container verschiebt Text mit. */
  override setPosition(x?: number, y?: number, z?: number, w?: number): this {
    return super.setPosition(x, y, z, w);
  }

  private onUpdate(): void {
    if (!this.running) return;
    const ms = this.getElapsedMs();
    this.text.setText(this.prefix + this.format(ms));
  }

  /** Format hh:mm:ss:ms (ms = 3-stellig). */
  private format(msTotal: number): string {
    const ms = Math.floor(msTotal % 1000);
    const totalSeconds = Math.floor(msTotal / 1000);
    const s = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const m = totalMinutes % 60;
    const h = Math.floor(totalMinutes / 60);

    const p2 = (n: number) => n.toString().padStart(2, "0");
    const p3 = (n: number) => n.toString().padStart(3, "0");

    return `${p2(h)}:${p2(m)}:${p2(s)}:${p3(ms)}`;
  }
}
