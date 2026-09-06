/**
 * Deduplikuje SOUBĚŽNÉ požadavky se stejným klíčem — pokud pro daný
 * klíč už běží požadavek, vrátí STEJNÝ Promise, místo aby spustila
 * druhý síťový request (viz zadání: React Strict Mode dvojité spuštění
 * efektu, dvojité kliknutí, souběžné hledání). Po dokončení (úspěch i
 * chyba) se záznam vždy uklidí, ať klíč zůstane volný pro příští
 * hledání. Žádná persistence — jen v paměti běžící stránky.
 */
export class InFlightRequestMap<T> {
  private requests = new Map<string, Promise<T>>();

  run(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.requests.get(key);
    if (existing) return existing;

    const promise = factory().finally(() => {
      this.requests.delete(key);
    });
    this.requests.set(key, promise);
    return promise;
  }
}
