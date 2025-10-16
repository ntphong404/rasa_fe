import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import vi from "./vi.json";

const LANGUAGE_KEY = "language";

const getLanguage = (): string => {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
  if (savedLanguage) {
    return savedLanguage;
  }

  // Get browser language
  const browserLang = navigator.language;
  const language = browserLang.toLowerCase().startsWith("vi") ? "vi" : "en";

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
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export { getLanguage, setLanguage };
export default i18n;
