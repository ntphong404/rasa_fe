import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import vi from "./vi.json";

const LANGUAGE_KEY = "language";

const getLanguage = (): string => {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
  if (savedLanguage === "vi" || savedLanguage === "en") {
    return savedLanguage;
  }

  // Default to Vietnamese for this admin app.
  const browserLang = navigator.language;
  const language = browserLang.toLowerCase().startsWith("en") ? "en" : "vi";

  // Save the detected language
  localStorage.setItem(LANGUAGE_KEY, language);
  return language;
};

const setLanguage = (language: string): void => {
  localStorage.setItem(LANGUAGE_KEY, language);
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: getLanguage(),
  fallbackLng: "vi",
  interpolation: { escapeValue: false },
});

document.documentElement.lang = i18n.language;
i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language;
  setLanguage(language);
});

export { getLanguage, setLanguage };
export default i18n;
