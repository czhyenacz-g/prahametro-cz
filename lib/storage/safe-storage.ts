// Storage jako parametr (ne přímo window.localStorage) — jde otestovat
// bezpečné chování (private mode, zakázaný storage, quota) mockem, který
// při volání vyhodí, aniž by test potřeboval DOM/jsdom.
export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
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
