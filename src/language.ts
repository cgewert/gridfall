import i18next from "i18next";
import { t } from "i18next";

async function switchLanguage(lang: "en" | "de" | "ja" | "fr") {
  await i18next.changeLanguage(lang);
  // TODO: Re-render the game scene or update UI elements as needed
}
