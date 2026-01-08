import { describe, it, expect } from "vitest";
import { detectSpin } from "./spinDetection";

const EMPTY = "Q";
function emptyGrid(w = 10, h = 20) {
  return Array.from({ length: h }, () => Array(w).fill(EMPTY));
}

describe("T-Spin detection", () => {
  it("detects T-Spin when 3 corners are filled", () => {
    const g = emptyGrid();
    // Place blocks at 3 corners around center (cx,cy) = (5,5)
    g[4][4] = "X"; // tl
    g[4][6] = "X"; // tr
    g[6][4] = "X"; // bl

    const res = detectSpin({
      grid: g,
      empty: EMPTY,
      piece: "T",
      rotation: 0,
      posX: 4, // cx=5
      posY: 4, // cy=5
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      lastMoveWasRotation: true,
    });

    expect(res.kind).toBe("TSPIN");
  });
});
