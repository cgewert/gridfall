import type Phaser from "phaser";
import { SettingsEvents } from "./SettingsEvents";

export type SpawnSystem = "sevenBag" | "pureRandom";

const KEY = "gridfall.spawn.v1";
const ORDER: SpawnSystem[] = ["sevenBag", "pureRandom"];

class SpawnSettingsStore {
  private game?: Phaser.Game;
  private current: SpawnSystem = "sevenBag";

  init(game: Phaser.Game) {
    this.game = game;
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw) as SpawnSystem;
        if (ORDER.includes(v)) this.current = v;
      }
    } catch {
      console.log("No Spawn settings found!");
    }
  }

  get(): SpawnSystem {
    console.debug("SpawnSettingsStore.get", this.current);
    return this.current;
  }

  set(mode: SpawnSystem) {
    if (!ORDER.includes(mode)) return;

    this.current = mode;

    try {
      localStorage.setItem(KEY, JSON.stringify(mode));
    } catch {}

    this.game?.events.emit(SettingsEvents.SpawnSystemChanged, { data: mode });
  }

  /**
   * Set spawn system to the next available option.
   */
  public next(): void {
    const i = ORDER.indexOf(this.current);
    this.set(ORDER[(i + 1) % ORDER.length]);
  }

  /**
   * Set spawn system to the previous available option.
   */
  public prev(): void {
    const i = ORDER.indexOf(this.current);
    this.set(ORDER[(i - 1 + ORDER.length) % ORDER.length]);
  }
}

export const SpawnSettings = new SpawnSettingsStore();
export const SPAWN_ORDER = ORDER;
