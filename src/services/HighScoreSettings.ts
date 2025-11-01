export type HighScoreData = {
  mode: {
    ascent: { time: number; score: number };
    rush: { time: number; score: number };
    infinity: { time: number; score: number };
  };
};

class HighScoreSettingsStore {
  private data: HighScoreData = {
    mode: {
      ascent: { time: 0, score: 0 },
      rush: { time: 0, score: 0 },
      infinity: { time: 0, score: 0 },
    },
  };

  public static STORAGE_KEY = "gridfall.highscores.v1";

  public get HasSettings() {
    return localStorage.getItem(HighScoreSettingsStore.STORAGE_KEY) !== null;
  }

  load() {
    try {
      const raw = localStorage.getItem(HighScoreSettingsStore.STORAGE_KEY);
      if (raw) this.data = { ...this.data, ...JSON.parse(raw) };
    } catch {
      console.warn("Failed to load high score settings");
    }
  }

  save() {
    try {
      localStorage.setItem(
        HighScoreSettingsStore.STORAGE_KEY,
        JSON.stringify(this.data)
      );
    } catch {
      console.warn("Failed to save high score settings");
    }
  }

  get AscentHighScore() {
    return this.data.mode.ascent;
  }
  get RushHighScore() {
    return this.data.mode.rush;
  }
  get InfinityHighScore() {
    return this.data.mode.infinity;
  }

  set AscentHighScore(v: { time: number; score: number }) {
    this.data.mode.ascent = v;
    this.save();
  }
  set RushHighScore(v: { time: number; score: number }) {
    this.data.mode.rush = v;
    this.save();
  }
  set InfinityHighScore(v: { time: number; score: number }) {
    this.data.mode.infinity = v;
    this.save();
  }
}

export const HighScoreSettings = new HighScoreSettingsStore();
