import Phaser from "phaser";
import { SettingsEvents } from "./SettingsEvents";

export type SkinId =
  | "neon"
  | "minosPastel"
  | "minos1"
  | "minos2"
  | "minos3"
  | "minos4";

const KEY = "gridfall.skin.v1";

const ORDER: SkinId[] = [
  "neon",
  "minosPastel",
  "minos1",
  "minos2",
  "minos3",
  "minos4",
];

class SkinSettingsStore {
  private game?: Phaser.Game;
  private current: SkinId = "minosPastel";

  init(game: Phaser.Game) {
    this.game = game;
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const val = JSON.parse(raw) as SkinId;
        if (ORDER.includes(val)) this.current = val;
      }
    } catch {}
  }

  get(): SkinId {
    return this.current;
  }

  set(id: SkinId) {
    if (!ORDER.includes(id)) return;
    this.current = id;
    try {
      localStorage.setItem(KEY, JSON.stringify(id));
    } catch {}
    this.game?.events.emit(SettingsEvents.TetriminoSkinChanged, { skin: id });
  }

  next() {
    const i = ORDER.indexOf(this.current);
    this.set(ORDER[(i + 1) % ORDER.length]);
  }
  prev() {
    const i = ORDER.indexOf(this.current);
    this.set(ORDER[(i - 1 + ORDER.length) % ORDER.length]);
  }
}

export const SkinSettings = new SkinSettingsStore();
export const SKIN_ORDER = ORDER;
