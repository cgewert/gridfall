import type { TetriminoShape } from "../shapes";

export function collides(
  grid: string[][],
  empty: string,
  posX: number,
  posY: number,
  shape: TetriminoShape,
  offsetX: number,
  offsetY: number
): boolean {
  const x0 = posX + offsetX;
  const y0 = posY + offsetY;

  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  return shape.some((row, y) =>
    row.some((cell, x) => {
      if (!cell) return false;

      const gx = x0 + x;
      const gy = y0 + y;

      // Bounds as in GameScene.checkCollision
      if (gx < 0 || gx >= width || gy >= height) return true;

      // gy < 0 is allowed (spawn above grid)
      if (gy >= 0 && grid[gy][gx] !== empty) return true;

      return false;
    })
  );
}
