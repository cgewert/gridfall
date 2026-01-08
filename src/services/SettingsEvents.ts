/**
 * Custom Event names for settings changes.
 * These events are emitted when the corresponding setting is changed via the settings services.
 * Phaser scenes can subscribe to these events to react to settings changes.
 */
export const SettingsEvents = {
  LanguageChanged: "settings:language-changed",

  AudioChanged: "settings:audio-changed",

  InputChanged: "settings:input-changed",

  TetriminoSkinChanged: "settings:tetrimino-skin-changed",

  SpawnSystemChanged: "settings:spawn-system-changed",
} as const;

export type SettingsEventKey =
  (typeof SettingsEvents)[keyof typeof SettingsEvents];
