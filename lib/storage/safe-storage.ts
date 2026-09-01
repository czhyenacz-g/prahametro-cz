// Storage jako parametr (ne přímo window.localStorage) — jde otestovat
// bezpečné chování (private mode, zakázaný storage, quota) mockem, který
// při volání vyhodí, aniž by test potřeboval DOM/jsdom.
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  /** Volitelné, ať staré testovací mocky (jen getItem/setItem) dál typují. */
  removeItem?(key: string): void;
};

export function safeGet(storage: StorageLike | null | undefined, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(storage: StorageLike | null | undefined, key: string, value: string): void {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Ignorováno — private mode / zakázaný storage / quota. Appka musí
    // fungovat i bez perzistentního uložení preference.
  }
}

/**
 * Bezpečné odstranění neplatné/zastaralé uložené hodnoty (viz
 * hooks/useSelectedAd.ts — stará uložená kampaň bez platného odkazu se
 * takhle uklidí, ať se příště zase nezkouší obnovit). Chybějící
 * `removeItem` na mocku (viz test/safe-storage.test.ts) se bezpečně
 * přeskočí, ne spadne.
 */
export function safeRemove(storage: StorageLike | null | undefined, key: string): void {
  if (!storage?.removeItem) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignorováno — stejný důvod jako u safeSet.
  }
}

export function getBrowserLocalStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Stejný bezpečný vzorec jako getBrowserLocalStorage — použito pro
 * stabilitu vybrané reklamy během jedné návštěvy (viz hooks/useSelectedAd.ts). */
export function getBrowserSessionStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
