"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserLocalStorage, safeGet, safeSet } from "../lib/storage/safe-storage.ts";
import { isWithinDismissWindow } from "../lib/storage/dismiss-window.ts";

/**
 * Obecné "zavři a nezobrazuj znovu X dní" chování pro libovolný
 * nenápadný banner/CTA — použito primárně pro components/pwa/InstallPrompt.tsx,
 * ale záměrně bez PWA specifik (žádný import z lib/pwa/*), ať jde
 * copy-pasnout i pro jiný banner v tomhle nebo jiném projektu (viz
 * zadání bod 13 "přenositelnost").
 *
 * Server i první klientský render vrací `dismissed: false` (stejný
 * hydration-safe vzorec jako I18nProvider.tsx/useSelectedAd.ts — žádné
 * čtení localStorage při SSR), teprve `useEffect` po mountu doplní
 * skutečný stav. Chybějící/nedostupný localStorage (private mode,
 * embedded browser) se chová jako "nikdy nezavřeno" — viz safe-storage.ts.
 */
export function usePersistentDismiss(storageKey: string, remindAfterMs: number): { dismissed: boolean; dismiss: () => void } {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = safeGet(getBrowserLocalStorage(), storageKey);
    setDismissed(isWithinDismissWindow(stored, Date.now(), remindAfterMs));
  }, [storageKey, remindAfterMs]);

  const dismiss = useCallback(() => {
    safeSet(getBrowserLocalStorage(), storageKey, String(Date.now()));
    setDismissed(true);
  }, [storageKey]);

  return { dismissed, dismiss };
}
