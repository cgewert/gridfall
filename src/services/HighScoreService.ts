export const HIGHSCORE_KEY = "gridfall.highscores";

export type HighscoresV1 = {
  version: 1;
  rush: RushScoreEntry[];
  // sprint?: ...
  // marathon?: ...
};

export type RushScoreEntry = {
  timeMs: number; // Time needed until goal was reached (40+ Lines)
  linesCleared: number; // Actual lines cleared (can be > 40)
  achievedAt: string; // ISO date string, e.g. new Date().toISOString()
};

const MAX_ENTRIES = 10;

function createDefaultScores(): HighscoresV1 {
  return { version: 1, rush: [] };
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

  // Returns the best Rush highscore entry, or null if no scores exist.
  public static getRushBest(): RushScoreEntry | null {
    const data = this.load();
    return data.rush.length ? data.rush[0] : null;
  }

  // Returns all Rush highscore entries, sorted by best time.
  public static getRushTimes(limit: number = 0): RushScoreEntry[] {
    return limit > 0 ? this.load().rush.slice(0, limit) : this.load().rush;
  }
}
