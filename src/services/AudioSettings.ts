export type AudioSettingsData = { music: number; sfx: number };
export type AudioType = "music" | "sfx" | undefined;

class AudioSettingsStore {
  private data: AudioSettingsData = { music: 0.1, sfx: 0.1 };

  public static STORAGE_KEY = "gridfall.audio.v1";

  public get HasSettings() {
    return localStorage.getItem(AudioSettingsStore.STORAGE_KEY) !== null;
  }

  load() {
    try {
      const raw = localStorage.getItem(AudioSettingsStore.STORAGE_KEY);
      if (raw) this.data = { ...this.data, ...JSON.parse(raw) };
    } catch {
      console.warn("Failed to load audio settings");
    }
  }

  save() {
    try {
      localStorage.setItem(
        AudioSettingsStore.STORAGE_KEY,
        JSON.stringify(this.data)
      );
    } catch {
      console.warn("Failed to save audio settings");
    }
  }

  get MusicVolume() {
    return this.data.music;
  }
  get SfxVolume() {
    return this.data.sfx;
  }

  set MusicVolume(v: number) {
    this.data.music = Phaser.Math.Clamp(v, 0, 1);
    this.save();
  }
  set SfxVolume(v: number) {
    this.data.sfx = Phaser.Math.Clamp(v, 0, 1);
    this.save();
  }

  /** Applies the audio settings to a Phaser scene. */
  applyToScene(scene: Phaser.Scene) {
    const sm = scene.sound as Phaser.Sound.BaseSoundManager;
    sm.getAll().forEach((s) => {
      // We hack tags onto music and sfx sounds to differentiate them, as Phaser does not provide this.
      const tag = (s as any).__tag as AudioType;
      if (!tag) return;
      if (tag === "music")
        (s as Phaser.Sound.WebAudioSound).setVolume(this.MusicVolume);
      if (tag === "sfx")
        (s as Phaser.Sound.WebAudioSound).setVolume(this.SfxVolume);
    });
  }
}

export const AudioSettings = new AudioSettingsStore();
