"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDictionary } from "../../lib/i18n/dictionary.ts";
import { VULGAR_STORAGE_KEY, type Locale } from "../../lib/i18n/types.ts";
import { getBrowserLocalStorage, safeGet, safeSet } from "../../lib/storage/safe-storage.ts";
import { I18nContext } from "./I18nContext.ts";

/**
 * `locale` je POVINNÝ prop odvozený serverem z routy (viz
 * app/(cs)/page.tsx → "cs", app/en/page.tsx → "en") — URL je jediný
 * zdroj pravdy pro jazyk stránky (viz zadání). Nikdy se needetekuje z
 * `navigator.language` ani needetekuje/nepřepisuje z `localStorage` —
 * díky tomu server i první klientský render vždy vykreslí STEJNÝ
 * jazyk, takže nemůže dojít k hydration mismatchi a starý uložený
 * jazyk nemůže po hydrataci "/en" přepnout zpět do češtiny (ani
 * naopak).
 *
 * `vulgar` zůstává jediný stav, který se čte/ukládá do
 * `localStorage` — nezávisle na jazyce, přesně jako dřív (server i
 * první klientský render vrací `false`, teprve `useEffect` po mountu
 * stav případně opraví — stejný hydration-safe vzorec).
 */
export default function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [vulgar, setVulgar] = useState(false);

  useEffect(() => {
    const storedVulgar = safeGet(getBrowserLocalStorage(), VULGAR_STORAGE_KEY);
    if (storedVulgar === "true") setVulgar(true);
  }, []);

  const toggleVulgar = useCallback(() => {
    setVulgar((prev) => {
      const next = !prev;
      safeSet(getBrowserLocalStorage(), VULGAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ locale, dict: getDictionary(locale), vulgar, toggleVulgar }), [locale, vulgar, toggleVulgar]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
