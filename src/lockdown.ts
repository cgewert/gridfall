// src/lockdown.ts

export interface LockdownConfig {
  lockDelayMs: number; // Guideline: 500ms
  maxResets: number; // Guideline: 15
}

export class ExtendedPlacementLockdown {
  private grounded = false;
  private timeLeftMs = 0;
  private resetsUsed = 0;
  private lowestY = Number.NEGATIVE_INFINITY;

  constructor(private cfg: LockdownConfig) {}

  public onSpawn(currentY: number) {
    this.grounded = false;
    this.timeLeftMs = 0;
    this.resetsUsed = 0;
    this.lowestY = currentY;
  }

  /** Call when the piece successfully moved down (gravity/softdrop). */
  public onFellToY(currentY: number) {
    if (currentY > this.lowestY) {
      this.lowestY = currentY;
      this.resetsUsed = 0; // reset counter if it falls below previous lowest :contentReference[oaicite:3]{index=3}
    }
  }

  /** Update grounded state each frame (or whenever position changes). */
  public updateGrounded(isGrounded: boolean) {
    if (isGrounded && !this.grounded) {
      // just touched ground: start timer
      this.timeLeftMs =
        this.resetsUsed >= this.cfg.maxResets ? 0 : this.cfg.lockDelayMs;
    }
    if (!isGrounded && this.grounded) {
      // left ground: stop timer
      this.timeLeftMs = 0;
    }
    this.grounded = isGrounded;
  }

  /** Call only if a move/rotation actually succeeded. */
  public onSuccessfulMoveOrRotate() {
    if (!this.grounded) return;

    if (this.resetsUsed < this.cfg.maxResets) {
      this.resetsUsed++;
      this.timeLeftMs = this.cfg.lockDelayMs; // reset to 0.5s :contentReference[oaicite:4]{index=4}
    }
    // If resets are exhausted, we simply don't reset anymore.
    // If the piece leaves ground and touches again, updateGrounded() will set timeLeftMs to 0 => instant lock-on-touch (Guideline note). :contentReference[oaicite:5]{index=5}
  }

  public tick(deltaMs: number): { shouldLock: boolean } {
    if (!this.grounded) return { shouldLock: false };
    this.timeLeftMs -= deltaMs;
    return { shouldLock: this.timeLeftMs <= 0 };
  }

  // Helpers for visuals/debug
  public get IsActive() {
    return this.grounded && this.timeLeftMs > 0;
  }
  public get LockDelayMs() {
    return this.cfg.lockDelayMs;
  }
  public get TimeLeftMs() {
    return this.timeLeftMs;
  }
  public get ResetsUsed() {
    return this.resetsUsed;
  }
}
