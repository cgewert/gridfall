/**
 * Custom Event names for settings changes.
 */
export const SettingsEvents = {
  LanguageChanged: "settings:language-changed",

  AudioChanged: "settings:audio-changed",

  InputChanged: "settings:input-changed",

  GeneralChanged: "settings:general-changed",
} as const;

export type SettingsEventKey =
  (typeof SettingsEvents)[keyof typeof SettingsEvents];
