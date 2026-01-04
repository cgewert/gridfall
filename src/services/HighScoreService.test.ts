import { describe, it, expect, beforeEach } from "vitest";
import {
  AscentScoreEntry,
  HighscoreService,
  InfinityScoreEntry,
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

  it("Infinity mode: sorts by descending score (higher is better) and returns top 3", () => {
    const entries: InfinityScoreEntry[] = [
      {
        timeMs: 3000,
        achievedAt: "2026-03-01",
        linesCleared: 99,
        score: 999,
      },
      {
        timeMs: 2000,
        achievedAt: "2026-03-03",
        linesCleared: 103,
        score: 444,
      },
      {
        timeMs: 4000,
        achievedAt: "2026-03-02",
        linesCleared: 105,
        score: 999,
      },
      {
        timeMs: 1000,
        achievedAt: "2026-03-10",
        linesCleared: 104,
        score: 333, // lowest score should not be in Top3
      },
    ];
    entries.forEach((entr) => HighscoreService.submitInfinity(entr));

    const top = HighscoreService.getInfinityTimes(3);
    expect(top.map((x) => x.score)).toEqual([999, 999, 444]);
  });

  it("Infinity mode: returns all entries when limit is 0", () => {
    const entries: InfinityScoreEntry[] = [
      {
        timeMs: 3000,
        achievedAt: "2026-03-01",
        linesCleared: 99,
        score: 999,
      },
      {
        timeMs: 2000,
        achievedAt: "2026-03-01",
        linesCleared: 103,
        score: 444,
      },
      {
        timeMs: 4000,
        achievedAt: "2026-03-02",
        linesCleared: 105,
        score: 999,
      },
      {
        timeMs: 1000,
        achievedAt: "2026-03-01",
        linesCleared: 104,
        score: 333,
      },
    ];
    entries.forEach((entr) => HighscoreService.submitInfinity(entr));
    const top = HighscoreService.getInfinityTimes(0);
    expect(top.length).toBe(4);
  });

  it("Infinity mode: returns correctly filtered entries when limit is 2", () => {
    const entries: InfinityScoreEntry[] = [
      {
        timeMs: 3000,
        achievedAt: "2026-03-01",
        linesCleared: 99,
        score: 999,
      },
      {
        timeMs: 2000,
        achievedAt: "2026-03-01",
        linesCleared: 103,
        score: 444,
      },
      {
        timeMs: 4000,
        achievedAt: "2026-03-02",
        linesCleared: 105,
        score: 999,
      },
      {
        timeMs: 1000,
        achievedAt: "2026-03-01",
        linesCleared: 104,
        score: 333,
      },
    ];
    entries.forEach((entr) => HighscoreService.submitInfinity(entr));
    const top = HighscoreService.getInfinityTimes(2);
    expect(top.length).toBe(2);
  });

  it("Infinity mode: returns correct isNewBest flag", () => {
    const entries: InfinityScoreEntry[] = [
      {
        timeMs: 3000,
        achievedAt: "2026-03-01",
        linesCleared: 99,
        score: 999,
      },
      {
        timeMs: 2000,
        achievedAt: "2026-03-01",
        linesCleared: 103,
        score: 444,
      },
      {
        timeMs: 4000,
        achievedAt: "2026-03-02",
        linesCleared: 105,
        score: 5000,
      },
    ];

    const newBest1 = HighscoreService.submitInfinity(entries[0]);
    const noBest = HighscoreService.submitInfinity(entries[1]);
    const newBest2 = HighscoreService.submitInfinity(entries[2]);
    expect(newBest1.isNewBest).toBe(true);
    expect(noBest.isNewBest).toBe(false);
    expect(newBest2.isNewBest).toBe(true);
  });

  it("Rush mode: returns correct isNewBest flag", () => {
    const entries: RushScoreEntry[] = [
      {
        timeMs: 3000,
        achievedAt: "2026-03-01",
        linesCleared: 99,
      },
      {
        timeMs: 9999,
        achievedAt: "2026-03-01",
        linesCleared: 103,
      },
      {
        timeMs: 100,
        achievedAt: "2026-03-02",
        linesCleared: 105,
      },
      {
        timeMs: 50,
        achievedAt: "2026-03-02",
        linesCleared: 105,
      },
      {
        timeMs: 3500,
        achievedAt: "2026-03-02",
        linesCleared: 105,
      },
    ];

    const newBest1 = HighscoreService.submitRush(entries[0]);
    const noBest = HighscoreService.submitRush(entries[1]);
    const newBest2 = HighscoreService.submitRush(entries[2]);
    const newBest3 = HighscoreService.submitRush(entries[3]);
    const noBest2 = HighscoreService.submitRush(entries[4]);
    expect(newBest1.isNewBest).toBe(true);
    expect(noBest.isNewBest).toBe(false);
    expect(newBest2.isNewBest).toBe(true);
    expect(newBest3.isNewBest).toBe(true);
    expect(noBest2.isNewBest).toBe(false);
  });

  it("Infinity mode: returns correct isNewBest flag", () => {
    const entries: InfinityScoreEntry[] = [
      {
        timeMs: 3000,
        achievedAt: "2026-03-01",
        linesCleared: 99,
        score: 999,
      },
      {
        timeMs: 2000,
        achievedAt: "2026-03-01",
        linesCleared: 103,
        score: 444,
      },
      {
        timeMs: 4000,
        achievedAt: "2026-03-02",
        linesCleared: 105,
        score: 5000,
      },
    ];

    const newBest1 = HighscoreService.submitInfinity(entries[0]);
    const noBest = HighscoreService.submitInfinity(entries[1]);
    const newBest2 = HighscoreService.submitInfinity(entries[2]);
    expect(newBest1.isNewBest).toBe(true);
    expect(noBest.isNewBest).toBe(false);
    expect(newBest2.isNewBest).toBe(true);
  });

  it("Ascent mode: returns correct isNewBest flag", () => {
    const entries: AscentScoreEntry[] = [
      {
        timeMs: 3000,
        achievedAt: "2026-03-01",
        linesCleared: 99,
        score: 999,
      },
      {
        timeMs: 2000,
        achievedAt: "2026-03-01",
        linesCleared: 103,
        score: 444,
      },
      {
        timeMs: 4000,
        achievedAt: "2026-03-02",
        linesCleared: 105,
        score: 5000,
      },
    ];

    const newBest1 = HighscoreService.submitAscent(entries[0]);
    const noBest = HighscoreService.submitAscent(entries[1]);
    const newBest2 = HighscoreService.submitAscent(entries[2]);
    expect(newBest1.isNewBest).toBe(true);
    expect(noBest.isNewBest).toBe(false);
    expect(newBest2.isNewBest).toBe(true);
  });
});
