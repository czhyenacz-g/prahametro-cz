import type { AdEvent } from "./types.ts";

export type AdEventHandler = (event: AdEvent) => void;

/**
 * Příprava na budoucí měření (viz zadání) — v produkci NIKAM
 * neodesílá, žádný network request, cookie ani tracking pixel. Jen
 * vývojový `console.debug` pro budoucí ladění. Impression se volá až
 * při skutečném vykreslení karty s vybranou kampaní (viz AdCard.tsx),
 * ne při pouhém výběru v `selectAd`/`resolveSelectedAd`.
 */
export const emitAdEvent: AdEventHandler = (event) => {
  if (process.env.NODE_ENV === "development") {
    console.debug("[ads]", event);
  }
};
