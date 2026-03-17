import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import zhHK from "./zh-HK.json";
import en from "./en.json";

const deviceLocale = Localization.getLocales()[0]?.languageTag ?? "zh-HK";

// Map device locale to our supported locales
function resolveLocale(tag: string): string {
  if (tag.startsWith("zh")) return "zh-HK";
  if (tag.startsWith("en")) return "en";
  return "zh-HK"; // default
}

i18n.use(initReactI18next).init({
  resources: {
    "zh-HK": { translation: zhHK },
    en: { translation: en },
  },
  lng: resolveLocale(deviceLocale),
  fallbackLng: "zh-HK",
  interpolation: {
    escapeValue: false, // React already handles escaping
  },
});

export default i18n;
