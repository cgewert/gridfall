import i18next from "i18next";

export type Locale = "de" | "en" | "fr" | "ja";

export const SUPPORTED_LOCALES: Locale[] = ["de", "en", "fr", "ja"];

// Für die Anzeige im Menü
export const LOCALE_NAME: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  ja: "日本語",
};

const KEY = "gridfall.lang.v1";

class LanguageSettingsStore {
  private current: Locale = "en";

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const val = JSON.parse(raw) as Locale;
        if (SUPPORTED_LOCALES.includes(val)) this.current = val;
      }
    } catch (ex) {
      console.error("Failed to load language from localStorage: ", ex);
    }
  }

  get(): Locale {
    return this.current;
  }

  set(lang: Locale) {
    if (!SUPPORTED_LOCALES.includes(lang)) return;
    this.current = lang;
    try {
      localStorage.setItem(KEY, JSON.stringify(lang));
    } catch {}
    i18next.changeLanguage(lang).catch(() => {
      console.error("Failed to change language to ", lang);
    });
    i18next.emit?.("languageChanged", lang as any);
    // oder via Phaser GameEvent:
    // this._game?.events.emit('i18n:language-changed', lang);
  }

  next() {
    const idx = SUPPORTED_LOCALES.indexOf(this.current);
    const next = SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length];
    this.set(next);
  }
  prev() {
    const idx = SUPPORTED_LOCALES.indexOf(this.current);
    const prev =
      SUPPORTED_LOCALES[
        (idx - 1 + SUPPORTED_LOCALES.length) % SUPPORTED_LOCALES.length
      ];
    this.set(prev);
  }
}

export const LanguageSettings = new LanguageSettingsStore();
