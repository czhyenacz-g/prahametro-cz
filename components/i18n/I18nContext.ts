"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "../../lib/i18n/dictionary.ts";
import type { Locale } from "../../lib/i18n/types.ts";

export type I18nContextValue = {
  /** Pevně dané routou (viz app/(cs)/page.tsx a app/en/page.tsx), po celou dobu života stránky neměnné — jazyk se mění navigací na jinou URL, ne klientským přepnutím. */
  locale: Locale;
  dict: Dictionary;
  vulgar: boolean;
  toggleVulgar: () => void;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n musí být použito uvnitř <I18nProvider>.");
  }
  return ctx;
}
