/**
 * Custom Event names for settings changes.
 */
export const SettingsEvents = {
  LanguageChanged: "settings:language-changed",

  AudioChanged: "settings:audio-changed",

  InputChanged: "settings:input-changed",

  TetriminoSkinChanged: "settings:tetrimino-skin-changed",
} as const;

export type SettingsEventKey =
  (typeof SettingsEvents)[keyof typeof SettingsEvents];
