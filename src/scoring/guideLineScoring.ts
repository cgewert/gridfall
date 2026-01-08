import type { SpinResult } from "./spinDetection";

export type DropKind = "SOFT" | "HARD";

export type ClearLabel =
  | { label: "NONE" }
  | { label: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD" }
  | { label: "TSPIN"; mini: boolean; lines: 0 | 1 | 2 | 3 }
  | { label: "SPIN"; piece: "J" | "L" | "S" | "Z"; lines: 0 | 1 | 2 | 3 };

export interface ScoreState {
  score: number;
  level: number;
  combo: number; // -1 = no chain; else 0..n (0 = first in chain)
  backToBack: boolean;
}

export interface ApplyClearInput {
  state: ScoreState;
  linesCleared: 0 | 1 | 2 | 3 | 4;
  spin: SpinResult;
  perfectClear: boolean;
}

export interface ApplyClearOutput {
  gained: number;
  next: ScoreState;
  label: ClearLabel;
  b2bApplied: boolean;
  calloutText: string | null; // one string (can include \n)
}

// Guideline base points + T-Spin/Mini
function basePoints(label: ClearLabel, level: number): number {
  if (label.label === "SINGLE") return 100 * level;
  if (label.label === "DOUBLE") return 300 * level;
  if (label.label === "TRIPLE") return 500 * level;
  if (label.label === "QUAD") return 800 * level;
  if (label.label === "TSPIN") {
    const l = label.lines;
    if (label.mini) {
      if (l === 0) return 100 * level;
      if (l === 1) return 200 * level;
      if (l === 2) return 400 * level;
      return 0;
    } else {
      if (l === 0) return 400 * level;
      if (l === 1) return 800 * level;
      if (l === 2) return 1200 * level;
      if (l === 3) return 1600 * level;
      return 0;
    }
  }

  // Extra spins sind erstmal nur visual (Guideline scoring)
  return 0;
}

function isB2BEligible(label: ClearLabel): boolean {
  if (label.label === "QUAD") return true;
  if (label.label === "TSPIN") return label.lines >= 1; // mini also qualifies, if line clear
  return false;
}

function breaksB2B(label: ClearLabel): boolean {
  // Singles/Doubles/Triples without T-Spin break B2B
  return (
    label.label === "SINGLE" ||
    label.label === "DOUBLE" ||
    label.label === "TRIPLE"
  );
}

function linesToStdLabel(
  lines: number
): "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD" | null {
  if (lines === 1) return "SINGLE";
  if (lines === 2) return "DOUBLE";
  if (lines === 3) return "TRIPLE";
  if (lines === 4) return "QUAD";
  return null;
}

export function applyGuidelineClearScore(
  input: ApplyClearInput
): ApplyClearOutput {
  const { state, linesCleared, spin, perfectClear } = input;

  const lc = linesCleared as 0 | 1 | 2 | 3 | 4;

  // --- Build label (display + scoring driver) ---
  let label: ClearLabel = { label: "NONE" };

  if (spin.kind === "TSPIN") {
    const l = Math.min(3, lc) as 0 | 1 | 2 | 3;
    label = { label: "TSPIN", mini: spin.mini, lines: l };
  } else if (spin.kind === "SPIN") {
    const l = Math.min(3, lc) as 0 | 1 | 2 | 3;
    label = { label: "SPIN", piece: spin.piece, lines: l };
  } else {
    const std = linesToStdLabel(lc);
    if (std) label = { label: std };
  }

  // --- Combo update (Guideline style): only if linesCleared>0 ---
  let nextCombo = state.combo;
  const didClearLines = lc > 0;
  if (didClearLines) nextCombo = Math.max(-1, nextCombo) + 1;
  else nextCombo = -1;

  // --- Base points ---
  // For non-T spins: score by normal line clear (Guideline), but display SPIN
  const scoringLabel: ClearLabel =
    label.label === "SPIN"
      ? linesToStdLabel(lc)
        ? { label: linesToStdLabel(lc)! }
        : { label: "NONE" }
      : label;

  let gained = basePoints(scoringLabel, state.level);

  // --- B2B multiplier applies to eligible clears (base only) ---
  const eligible = isB2BEligible(scoringLabel);
  const b2bApplied = eligible && state.backToBack;
  if (b2bApplied) gained = Math.floor(gained * 1.5);

  // --- Combo bonus (additive, not multiplied) ---
  if (didClearLines) gained += 50 * nextCombo * state.level;

  // TODO: Perfect Clear bonus ?
  if (perfectClear) {
    // gained += ...
  }

  // --- Next B2B state ---
  let nextB2B = state.backToBack;
  if (eligible) nextB2B = true;
  else if (breaksB2B(scoringLabel)) nextB2B = false;

  // --- Callout text ---
  const calloutText = buildCalloutText(label, {
    b2bApplied,
    perfectClear,
    combo: nextCombo,
    didClearLines,
  });

  return {
    gained,
    next: {
      ...state,
      score: state.score + gained,
      combo: nextCombo,
      backToBack: nextB2B,
    },
    label,
    b2bApplied,
    calloutText,
  };
}

function buildCalloutText(
  label: ClearLabel,
  meta: {
    b2bApplied: boolean;
    perfectClear: boolean;
    combo: number;
    didClearLines: boolean;
  }
): string | null {
  const parts: string[] = [];

  if (meta.b2bApplied) parts.push("BACK-TO-BACK");

  const main = (() => {
    if (label.label === "NONE") return null;

    if (label.label === "TSPIN") {
      const lines = label.lines;
      const type =
        lines === 0
          ? label.mini
            ? "T-SPIN MINI"
            : "T-SPIN"
          : lines === 1
          ? label.mini
            ? "T-SPIN MINI SINGLE"
            : "T-SPIN SINGLE"
          : lines === 2
          ? label.mini
            ? "T-SPIN MINI DOUBLE"
            : "T-SPIN DOUBLE"
          : "T-SPIN TRIPLE";
      return type;
    }

    if (label.label === "SPIN") {
      const lines = label.lines;
      if (lines === 0) return `${label.piece}-SPIN`;
      if (lines === 1) return `${label.piece}-SPIN SINGLE`;
      if (lines === 2) return `${label.piece}-SPIN DOUBLE`;
      return `${label.piece}-SPIN TRIPLE`;
    }

    return label.label; // SINGLE/DOUBLE/TRIPLE/QUAD
  })();

  if (main) parts.push(main);

  // Optional: Combo as extra line
  if (meta.didClearLines && meta.combo >= 1) {
    parts.push(`COMBO x${meta.combo}`);
  }

  if (meta.perfectClear) {
    parts.push("ALL CLEAR");
  }

  if (parts.length === 0) return null;
  return parts.join("\n");
}

export function applyDropPoints(
  state: ScoreState,
  kind: DropKind,
  cells: number
): { gained: number; next: ScoreState } {
  if (cells <= 0) return { gained: 0, next: state };

  const perCell = kind === "SOFT" ? 1 : 2;
  const gained = perCell * cells;

  // Drop points are typically NOT multiplied by level.
  return { gained, next: { ...state, score: state.score + gained } };
}
