"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_NIGHT_THEME, NIGHT_THEME_STORAGE_KEY, isValidNightTheme, type NightTheme } from "../lib/night-transport/theme.ts";
import { getBrowserLocalStorage, safeGet, safeSet } from "../lib/storage/safe-storage.ts";

/**
 * Server i první klientský render vždy vrací `DEFAULT_NIGHT_THEME`
 * ("dark") — teprve `useEffect` po mountu případně opraví na uloženou
 * hodnotu. Stejný hydration-safe vzorec jako `vulgar` v
 * components/i18n/I18nProvider.tsx (zadání "žádný hydration mismatch").
 */
export function useNightTheme() {
  const [theme, setTheme] = useState<NightTheme>(DEFAULT_NIGHT_THEME);

  useEffect(() => {
    const stored = safeGet(getBrowserLocalStorage(), NIGHT_THEME_STORAGE_KEY);
    if (isValidNightTheme(stored)) setTheme(stored);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: NightTheme = prev === "dark" ? "light" : "dark";
      safeSet(getBrowserLocalStorage(), NIGHT_THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
