import { describe, it, expect, beforeEach } from "vitest";
import {
  AscentScoreEntry,
  HighscoreService,
  RushScoreEntry,
} from "./HighScoreService";

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

describe("HighScoreService sorting", () => {
  beforeEach(() => {
    // @ts-expect-error - test environment
    globalThis.localStorage = new MemoryStorage();
  });

  it("Rush: sorts by ascending time (lower is better) and returns top 3", () => {
    const entries: RushScoreEntry[] = [
      {
        timeMs: 62_000, // 1:02.000
        linesCleared: 40,
        achievedAt: "2026-03-01",
      },
      {
        timeMs: 61_500, // 1:01.500
        linesCleared: 40,
        achievedAt: "2026-03-01",
      },
      {
        timeMs: 59_999, // 0:59.999
        linesCleared: 40,
        achievedAt: "2026-03-01",
      },
      {
        timeMs: 70_000, // should not be in Top3
        linesCleared: 40,
        achievedAt: "2026-03-01",
      },
    ];

    entries.forEach((entr) => HighscoreService.submitRush(entr));

    const top = HighscoreService.getRushTimes(3);

    expect(top.map((x) => x.timeMs)).toEqual([59_999, 61_500, 62_000]);
  });

  it("Rush: Tie breaker sorting shall prefer more lines cleared when times are equal", () => {
    const entries: RushScoreEntry[] = [
      {
        timeMs: 62_000, // 1:02.000
        linesCleared: 40,
        achievedAt: "2026-03-01",
      },
      {
        timeMs: 62_000, // 1:02.000
        linesCleared: 43, // better tie-breaker
        achievedAt: "2026-03-01",
      },
      {
        timeMs: 59_999, // 0:59.999
        linesCleared: 40,
        achievedAt: "2026-03-01",
      },
    ];

    entries.forEach((entr) => HighscoreService.submitRush(entr));

    const top = HighscoreService.getRushTimes(3);

    expect(top.map((x) => [x.timeMs, x.linesCleared])).toEqual([
      [59_999, 40],
      [62_000, 43],
      [62_000, 40],
    ]);
  });

  it("Ascent mode: sorts by descending score (higher is better) and returns top 3", () => {
    const entries: AscentScoreEntry[] = [
      {
        achievedAt: "",
        linesCleared: 0,
        score: 1000, // lowest score should not be in Top3
        timeMs: 0,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 2500,
        timeMs: 0,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 1500,
        timeMs: 0,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 2000,
        timeMs: 0,
      },
    ];

    entries.forEach((entr) => HighscoreService.submitAscent(entr));

    const top = HighscoreService.getAscentTimes(3);

    expect(top.map((x) => x.score)).toEqual([2500, 2000, 1500]);
  });

  it("Ascent mode: When scores are equal, sorts by ascending time (lower is better)", () => {
    const entries: AscentScoreEntry[] = [
      {
        achievedAt: "",
        linesCleared: 0,
        score: 9999,
        timeMs: 0,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 9999,
        timeMs: 500,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 1500,
        timeMs: 0,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 10000,
        timeMs: 0,
      },
    ];

    entries.forEach((entr) => HighscoreService.submitAscent(entr));

    const top = HighscoreService.getAscentTimes(4);
    expect(top.map((x) => [x.score, x.timeMs])).toEqual([
      [10000, 0],
      [9999, 0],
      [9999, 500],
      [1500, 0],
    ]);
  });

  it("Service returns filtered entries correctly", () => {
    const entries: AscentScoreEntry[] = [
      {
        achievedAt: "",
        linesCleared: 0,
        score: 1000,
        timeMs: 0,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 2500,
        timeMs: 0,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 1500,
        timeMs: 0,
      },
      {
        achievedAt: "",
        linesCleared: 0,
        score: 2000,
        timeMs: 0,
      },
    ];

    entries.forEach((entr) => HighscoreService.submitAscent(entr));

    const top1 = HighscoreService.getAscentTimes(3);
    expect(top1.map((x) => x.score)).toEqual([2500, 2000, 1500]);
    const top2 = HighscoreService.getAscentTimes(4);
    expect(top2.map((x) => x.score)).toEqual([2500, 2000, 1500, 1000]);
    const top3 = HighscoreService.getAscentTimes(2);
    expect(top3.map((x) => x.score)).toEqual([2500, 2000]);
  });
});
