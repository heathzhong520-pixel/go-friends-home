"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { dictionaries, getDictionary, LOCALE_COOKIE, type Locale } from "../lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  dictionary: typeof dictionaries.zh | typeof dictionaries.en;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [activeLocale, setActiveLocale] = useState(locale);
  const value = useMemo<LocaleContextValue>(() => ({
    locale: activeLocale,
    dictionary: getDictionary(activeLocale),
    setLocale(nextLocale) {
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
      document.documentElement.lang = nextLocale === "zh" ? "zh-CN" : "en";
      setActiveLocale(nextLocale);
    },
  }), [activeLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
