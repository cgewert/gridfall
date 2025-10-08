import Phaser from "phaser";
import { AudioSettings } from "./AudioSettings";

/** Central Hub for playing audio within scenes by paying attention to the saved audio settings. */
export class AudioBus {
  public static AddSceneAudio(
    scene: Phaser.Scene,
    key: string,
    config?: Phaser.Types.Sound.SoundConfig
  ) {
    return scene.sound.add(key, config);
  }

  public static PlayMusic(
    scene: Phaser.Scene,
    key: string,
    config?: Phaser.Types.Sound.SoundConfig
  ) {
    const snd = scene.sound.get(key);
    if (!snd) {
      console.warn(`AudioBus: Music with key "${key}" not found in scene.`);
      return null;
    }
    // Hack a tag onto the sound to differentiate music and sfx, as Phaser does not provide this.
    (snd as any).__tag = "music";
    (snd as Phaser.Sound.WebAudioSound).setVolume(AudioSettings.MusicVolume);
    //(snd as Phaser.Sound.WebAudioSound).setVolume(1.0);
    if (!snd.isPlaying) {
      if (config) snd.play({ ...config, volume: AudioSettings.MusicVolume });
      else snd.play({ volume: AudioSettings.MusicVolume });
    }

    return snd;
  }

  public static PlaySfx(
    scene: Phaser.Scene,
    key: string,
    config?: Phaser.Types.Sound.SoundConfig
  ) {
    const snd = scene.sound.get(key);
    if (!snd) {
      console.warn(`AudioBus: SFX with key "${key}" not found in scene.`);
      return null;
    }
    // Hack a tag onto the sound to differentiate music and sfx, as Phaser does not provide this.
    (snd as any).__tag = "sfx";
    if (config) snd.play({ ...config, volume: AudioSettings.SfxVolume });
    else snd.play({ volume: AudioSettings.SfxVolume });

    return snd;
  }

  public static ApplySettings(scene: Phaser.Scene) {
    AudioSettings.applyToScene(scene);
  }
}
