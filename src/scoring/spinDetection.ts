// src/scoring/spinDetection.ts
import { Rotation } from "../game";
import type { TetriminoShape } from "../shapes";
import { collides } from "./gridCollision";

export type SpinResult =
  | { kind: "NONE" }
  | { kind: "TSPIN"; mini: boolean }
  | { kind: "SPIN"; piece: "J" | "L" | "S" | "Z" };

export function detectSpin(params: {
  grid: string[][];
  empty: string;
  piece: string;
  rotation: Rotation;
  posX: number;
  posY: number;
  shape: TetriminoShape;
  lastMoveWasRotation: boolean;
}): SpinResult {
  const {
    grid,
    empty,
    piece,
    rotation,
    posX,
    posY,
    shape,
    lastMoveWasRotation,
  } = params;

  if (!lastMoveWasRotation) return { kind: "NONE" };

  // --- T-Spin detection (Guideline-like) ---
  if (piece === "T") {
    // Pivot bei euren 3x3 T-shapes: center = (x+1,y+1)
    const cx = posX + 1;
    const cy = posY + 1;

    const tl = isCornerFilled(grid, empty, cx - 1, cy - 1);
    const tr = isCornerFilled(grid, empty, cx + 1, cy - 1);
    const bl = isCornerFilled(grid, empty, cx - 1, cy + 1);
    const br = isCornerFilled(grid, empty, cx + 1, cy + 1);

    const corners = Number(tl) + Number(tr) + Number(bl) + Number(br);
    if (corners < 3) return { kind: "NONE" };

    // Mini vs Full via "Front corners" (robust, ohne Kick-Index)
    const [f1, f2] =
      rotation === 0
        ? [tl, tr]
        : rotation === 1
        ? [tr, br]
        : rotation === 2
        ? [bl, br]
        : [tl, bl];

    const isFull = f1 && f2;
    return { kind: "TSPIN", mini: !isFull };
  }

  // --- Optional non-guideline spins: J/L/S/Z via "immobile" ---
  if (piece === "J" || piece === "L" || piece === "S" || piece === "Z") {
    const left = collides(grid, empty, posX, posY, shape, -1, 0);
    const right = collides(grid, empty, posX, posY, shape, +1, 0);
    const down = collides(grid, empty, posX, posY, shape, 0, +1);

    if (left && right && down) {
      return { kind: "SPIN", piece };
    }
  }

  return { kind: "NONE" };
}

// Für T-Spin corners: Wände/Boden zählen als "filled", Spawn über Grid nicht
function isCornerFilled(
  grid: string[][],
  empty: string,
  x: number,
  y: number
): boolean {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  if (x < 0 || x >= width) return true; // wall
  if (y >= height) return true; // floor
  if (y < 0) return false; // above playfield: treat as empty
  return grid[y][x] !== empty;
}
