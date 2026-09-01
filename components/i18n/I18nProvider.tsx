"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { detectBrowserLocale } from "../../lib/i18n/detect-locale.ts";
import { getDictionary } from "../../lib/i18n/dictionary.ts";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, VULGAR_STORAGE_KEY, type Locale } from "../../lib/i18n/types.ts";
import { getBrowserLocalStorage, safeGet, safeSet } from "../../lib/storage/safe-storage.ts";
import { I18nContext } from "./I18nContext.ts";

/**
 * Počáteční stav (locale=DEFAULT_LOCALE, vulgar=false) je STEJNÝ na
 * serveru i při prvním klientském vykreslení (hydrataci) — teprve
 * `useEffect` po mountu čte localStorage/navigator.language a případně
 * stav opraví. Tím se React hydration mismatch nikdy nestane: hydratace
 * proběhne s výchozími hodnotami, korekce přijde až jako samostatný
 * re-render po mountu (běžný, doporučený vzorec pro přesně tenhle
 * problém — viz zadání "Ošetři hydration mismatch").
 */
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [vulgar, setVulgar] = useState(false);

  useEffect(() => {
    const storage = getBrowserLocalStorage();
    const storedLocale = safeGet(storage, LOCALE_STORAGE_KEY);

    if (storedLocale === "cs" || storedLocale === "en") {
      setLocaleState(storedLocale);
    } else {
      const detected = detectBrowserLocale(typeof navigator !== "undefined" ? navigator.language : null);
      setLocaleState(detected);
    }

    const storedVulgar = safeGet(storage, VULGAR_STORAGE_KEY);
    if (storedVulgar === "true") setVulgar(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    safeSet(getBrowserLocalStorage(), LOCALE_STORAGE_KEY, next);
  }, []);

  const toggleVulgar = useCallback(() => {
    setVulgar((prev) => {
      const next = !prev;
      safeSet(getBrowserLocalStorage(), VULGAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ locale, dict: getDictionary(locale), vulgar, setLocale, toggleVulgar }),
    [locale, vulgar, setLocale, toggleVulgar]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
