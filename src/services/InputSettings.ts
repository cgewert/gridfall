import Phaser from "phaser";
import { SettingsEvents } from "./SettingsEvents";

type InputData = {
  dasMs: number; // Delayed Auto Shift
  arrMs: number; // Auto Repeat Rate (ms per Step; 0 = instant)
  sdfTps: number; // Soft Drop Speed (Tiles per Second)
};

/**
 * Key for localStorage
 */
const KEY = "gridfall.input.v1";

class InputSettingsStore {
  public static readonly DEFAULTS: InputData = {
    dasMs: 167,
    arrMs: 33,
    sdfTps: 6,
  };

  private game?: Phaser.Game;

  private data: InputData = {
    dasMs: InputSettingsStore.DEFAULTS.dasMs,
    arrMs: InputSettingsStore.DEFAULTS.arrMs,
    sdfTps: InputSettingsStore.DEFAULTS.sdfTps,
  };

  public init(game: Phaser.Game) {
    this.game = game;
  }

  public load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.data = { ...this.data, ...(JSON.parse(raw) as InputData) };
    } catch {}
  }

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {}
    this.game?.events.emit(SettingsEvents.InputChanged, { ...this.data });
  }

  get DAS() {
    return this.data.dasMs;
  }

  get ARR() {
    return this.data.arrMs;
  }

  get SDF() {
    return this.data.sdfTps;
  }

  setDAS(v: number) {
    this.data.dasMs = Phaser.Math.Clamp(Math.round(v), 0, 250);
    this.save();
  }

  public setARR(v: number) {
    this.data.arrMs = Phaser.Math.Clamp(Math.round(v), 0, 100);
    this.save();
  }

  public setSDF(v: number) {
    this.data.sdfTps = Phaser.Math.Clamp(Math.round(v), 1, 80);
    this.save();
  }

  public resetToDefaults() {
    this.data = { ...InputSettingsStore.DEFAULTS };
    this.save();
  }
}

export const InputSettings = new InputSettingsStore();
export type { InputData };
