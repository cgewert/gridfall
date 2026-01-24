import { describe, it, expect } from "vitest";
import { detectSpin } from "./spinDetection";

const EMPTY = "Q";
const X = "X";

function emptyGrid(w = 10, h = 20) {
  return Array.from({ length: h }, () => Array(w).fill(EMPTY));
}

function fillRowExcept(g: string[][], y: number, holes: number[]) {
  for (let x = 0; x < g[0].length; x++) {
    g[y][x] = holes.includes(x) ? EMPTY : X;
  }
}

// Rotation 1 (T facing right) – spans 3 rows
const T_SHAPE_R = [
  [0, 1, 0],
  [0, 1, 1],
  [0, 1, 0],
];

/**
 *  Try to read amount of cleared lines from detectSpin()-result.
 */
function getClearedLines(res: any): number | undefined {
  return (
    res?.clearedLines ?? res?.linesCleared ?? res?.lineClears ?? res?.clearLines
  );
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

  it("does NOT detect T-Spin if last move was not a rotation", () => {
    const g = emptyGrid();
    g[4][4] = "X";
    g[4][6] = "X";
    g[6][4] = "X";

    const res = detectSpin({
      grid: g,
      empty: EMPTY,
      piece: "T",
      rotation: 0,
      posX: 4,
      posY: 4,
      shape: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      lastMoveWasRotation: false,
    });

    expect(res.kind).not.toBe("TSPIN");
  });

  // it("detects T-Spin DOUBLE in a 2-line clear setup", () => {
  //   const g = emptyGrid();

  //   // We place the T shape like this:
  //   // posX=4,posY=17 => T cells land on:
  //   // (17,5), (18,5), (18,6), (19,5)
  //   //
  //   // For DOUBLE: Rows 18+19 become full, Row 17 remains NOT full.
  //   fillRowExcept(g, 17, [5, 0]); // Hole at x=5 for T, additionally x=0 open => row 17 remains incomplete
  //   fillRowExcept(g, 18, [5, 6]); // Holes for T
  //   fillRowExcept(g, 19, [5]); // Hole for T

  //   const res = detectSpin({
  //     grid: g,
  //     empty: EMPTY,
  //     piece: "T",
  //     rotation: 1,
  //     posX: 4,
  //     posY: 17,
  //     shape: T_SHAPE_R,
  //     lastMoveWasRotation: true,
  //   });

  //   expect(res.kind).toBe("TSPIN");

  //   const cleared = getClearedLines(res);
  //   // If your detectSpin does not provide the lines, this will be undefined and the test will fail –
  //   // then just adjust getClearedLines() to your result shape.
  //   expect(cleared).toBe(2);
  // });

  // it("detects T-Spin TRIPLE in a 3-line clear setup (regression)", () => {
  //   const g = emptyGrid();

  //   // For TRIPLE: Rows 17+18+19 become full after the T lock.
  //   fillRowExcept(g, 17, [5]); // Hole at x=5 for T
  //   fillRowExcept(g, 18, [5, 6]); // Holes for T
  //   fillRowExcept(g, 19, [5]); // Hole for T

  //   const res = detectSpin({
  //     grid: g,
  //     empty: EMPTY,
  //     piece: "T",
  //     rotation: 1,
  //     posX: 4,
  //     posY: 17,
  //     shape: T_SHAPE_R,
  //     lastMoveWasRotation: true,
  //   });

  //   expect(res.kind).toBe("TSPIN");

  //   const cleared = getClearedLines(res);
  //   expect(cleared).toBe(3);
  // });
});
