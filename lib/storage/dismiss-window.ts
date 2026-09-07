// Čistá logika pro hooks/usePersistentDismiss.ts — žádné volání
// `Date.now()`/`localStorage` přímo (ty zůstávají v hooku), aby šlo
// testovat bez DOM (stejný vzorec jako lib/metro/geolocation-state.ts).

/**
 * Bylo poslední zavření (ISO timestamp v ms, uložený jako string) v
 * posledních `remindAfterMs`? Chybějící/poškozená hodnota (private mode,
 * ručně upravený localStorage) se chová jako "nikdy nezavřeno" — bezpečný
 * fallback, appka nikdy nespadne ani nic natrvalo neschová.
 */
export function isWithinDismissWindow(storedValue: string | null, now: number, remindAfterMs: number): boolean {
  if (!storedValue) return false;
  const dismissedAt = Number(storedValue);
  if (!Number.isFinite(dismissedAt)) return false;
  return now - dismissedAt < remindAfterMs;
}
