"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, type Locale, type TranslationSchema } from "@/i18n/translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslationSchema;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const saved = localStorage.getItem("deplhoy_locale") as Locale | null;
    if (saved === "es" || saved === "en") {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("deplhoy_locale", newLocale);
  };

  const toggleLocale = () => {
    setLocale(locale === "es" ? "en" : "es");
  };

  const t = translations[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
