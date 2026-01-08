import { describe, it, expect } from "vitest";
import { applyDropPoints, applyGuidelineClearScore } from "./guidelineScoring";

describe("guideline scoring", () => {
  it("scores a Quad with level multiplier", () => {
    const res = applyGuidelineClearScore({
      state: { score: 0, level: 3, combo: -1, backToBack: false },
      linesCleared: 4,
      spin: { kind: "NONE" },
      perfectClear: false,
    });
    expect(res.gained).toBe(800 * 3); // first in chain: combo becomes 0 => +0
    expect(res.next.combo).toBe(0);
    expect(res.next.backToBack).toBe(true);
  });

  it("applies B2B 1.5x on eligible clears", () => {
    const res = applyGuidelineClearScore({
      state: { score: 0, level: 1, combo: -1, backToBack: true },
      linesCleared: 4,
      spin: { kind: "NONE" },
      perfectClear: false,
    });
    expect(res.gained).toBe(Math.floor(800 * 1.5)); // combo 0 => +0
    expect(res.b2bApplied).toBe(true);
  });

  it("scores T-Spin Double", () => {
    const res = applyGuidelineClearScore({
      state: { score: 0, level: 2, combo: -1, backToBack: false },
      linesCleared: 2,
      spin: { kind: "TSPIN", mini: false },
      perfectClear: false,
    });
    expect(res.gained).toBe(1200 * 2); // combo 0 => +0
    expect(res.next.backToBack).toBe(true);
  });

  it("breaks B2B on a normal SINGLE", () => {
    const res = applyGuidelineClearScore({
      state: { score: 0, level: 1, combo: -1, backToBack: true },
      linesCleared: 1,
      spin: { kind: "NONE" },
      perfectClear: false,
    });
    expect(res.next.backToBack).toBe(false);
  });

  it("soft drop gives +1 per cell (no level multiplier)", () => {
    const s = { score: 0, level: 10, combo: -1, backToBack: false };
    expect(applyDropPoints(s, "SOFT", 5).next.score).toBe(5);
  });

  it("hard drop gives +2 per cell (no level multiplier)", () => {
    const s = { score: 7, level: 3, combo: 0, backToBack: true };
    expect(applyDropPoints(s, "HARD", 4).next.score).toBe(7 + 8);
  });
});
