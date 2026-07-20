"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "./locale-provider";

const subscribe = () => () => {};

export function LanguageSwitcher({ className = "language" }: { className?: string }) {
  const { locale, dictionary, setLocale } = useLocale();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const nextLocale = locale === "zh" ? "en" : "zh";
  return (
    <button className={className} type="button" disabled={!mounted} onClick={() => setLocale(nextLocale)} aria-label={dictionary.switchLanguage}>
      ◎ {nextLocale === "en" ? "EN" : "中"}
    </button>
  );
}
