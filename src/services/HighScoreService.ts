export const HIGHSCORE_KEY = "gridfall.highscores";

export type HighscoresV1 = {
  version: 1;
  rush: RushScoreEntry[];
  ascent: AscentScoreEntry[];
  infinity: InfinityScoreEntry[];
};

export type RushScoreEntry = {
  timeMs: number; // Time needed until goal was reached (40+ Lines)
  linesCleared: number; // Actual lines cleared (can be > 40)
  achievedAt: string; // ISO date string, e.g. new Date().toISOString()
};

export type AscentScoreEntry = {
  achievedAt: string; // ISO date string, e.g. new Date().toISOString()
  linesCleared: number; // Actual lines cleared (can be > 150)
  score: number; // Score achieved upon reaching goal
  timeMs: number; // Time needed until goal was reached (150+ Lines)
};

export type InfinityScoreEntry = {
  achievedAt: string; // ISO date string, e.g. new Date().toISOString()
  linesCleared: number; // How many lines were cleared till game over
  score: number; // Score achieved
  timeMs: number; // Time played
};

const MAX_ENTRIES = 10;

function createDefaultScores(): HighscoresV1 {
  return { version: 1, rush: [], ascent: [], infinity: [] };
}

export class HighscoreService {
  public static load(): HighscoresV1 {
    const raw = localStorage.getItem(HIGHSCORE_KEY);
    if (!raw) return createDefaultScores();

    try {
      const parsed = JSON.parse(raw) as Partial<HighscoresV1>;
      if (parsed.version !== 1) return createDefaultScores();
      return {
        version: 1,
        rush: Array.isArray(parsed.rush)
          ? (parsed.rush as RushScoreEntry[])
          : [],
        ascent: Array.isArray(parsed.ascent)
          ? (parsed.ascent as AscentScoreEntry[])
          : [],
        infinity: Array.isArray(parsed.infinity)
          ? (parsed.infinity as InfinityScoreEntry[])
          : [],
      };
    } catch {
      return createDefaultScores();
    }
  }

  public static save(data: HighscoresV1): void {
    localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(data));
  }

  /** Adds a Rush-Run and keeps the list sorted (best time first). */
  public static submitRush(entry: RushScoreEntry): {
    isNewBest: boolean;
    best: RushScoreEntry | null;
  } {
    const data = this.load();

    data.rush.push(entry);

    data.rush.sort((a, b) => {
      // Primary: smaller time is better
      if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      // Secondary (optional): more lines as tie-breaker
      return b.linesCleared - a.linesCleared;
    });

    data.rush = data.rush.slice(0, MAX_ENTRIES);

    this.save(data);

    const best = data.rush.length > 0 ? data.rush[0] : null;
    const isNewBest =
      !!best &&
      best.timeMs === entry.timeMs &&
      best.linesCleared === entry.linesCleared &&
      best.achievedAt === entry.achievedAt;

    return { isNewBest, best };
  }

  public static submitInfinity(entry: InfinityScoreEntry): any {
    const data = this.load();

    data.infinity.push(entry);

    data.infinity.sort((a, b) => {
      // Primary: Higher score is better
      if (a.score !== b.score) return b.score - a.score;
      // Secondary: Smaller time is better
      if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      // If score and time are equal, earlier date is better
      return (
        new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime()
      );
    });

    data.infinity = data.infinity.slice(0, MAX_ENTRIES);

    this.save(data);

    const best = data.infinity.length > 0 ? data.infinity[0] : null;
    const isNewBest =
      !!best &&
      best.timeMs === entry.timeMs &&
      best.linesCleared === entry.linesCleared &&
      best.achievedAt === entry.achievedAt &&
      best.score === entry.score;

    return { isNewBest, best };
  }

  public static submitAscent(entry: AscentScoreEntry): any {
    const data = this.load();

    data.ascent.push(entry);

    data.ascent.sort((a, b) => {
      // Primary: Higher score is better
      if (a.score !== b.score) return b.score - a.score;
      // Secondary: smaller time is better
      if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      // If score and time are equal the earlier date is better
      return (
        new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime()
      );
    });

    data.ascent = data.ascent.slice(0, MAX_ENTRIES);

    this.save(data);

    const best = data.ascent.length > 0 ? data.ascent[0] : null;
    const isNewBest =
      !!best &&
      best.timeMs === entry.timeMs &&
      best.linesCleared === entry.linesCleared &&
      best.achievedAt === entry.achievedAt &&
      best.score === entry.score;

    return { isNewBest, best };
  }

  // Returns the best Rush highscore entry, or null if no scores exist.
  public static getRushBest(): RushScoreEntry | null {
    const data = this.load();
    return data.rush.length ? data.rush[0] : null;
  }

  public static getInfinityBest(): InfinityScoreEntry | null {
    const data = this.load();
    return data.infinity.length ? data.infinity[0] : null;
  }

  public static getAscentBest(): AscentScoreEntry | null {
    const data = this.load();
    return data.ascent.length ? data.ascent[0] : null;
  }

  // Returns all Rush highscore entries, sorted by best time.
  public static getRushTimes(limit: number = 0): RushScoreEntry[] {
    return limit > 0 ? this.load().rush.slice(0, limit) : this.load().rush;
  }

  // Returns all Infinity highscore entries, sorted by best time.
  public static getInfinityTimes(limit: number = 0): InfinityScoreEntry[] {
    return limit > 0
      ? this.load().infinity.slice(0, limit)
      : this.load().infinity;
  }

  // Returns all Ascent highscore entries, sorted by best time.
  public static getAscentTimes(limit: number = 0): AscentScoreEntry[] {
    return limit > 0 ? this.load().ascent.slice(0, limit) : this.load().ascent;
  }
}
