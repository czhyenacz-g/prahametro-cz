import type { Language } from "./types.ts";

/**
 * Deterministická součást výběrové logiky (viz zadání) — de/uk zatím
 * nemají vlastní kampaně, takže spadají zpět na anglické. cs a en
 * žádný fallback nemají: bez způsobilé české kampaně appka ukáže
 * svátkový panel (ne anglickou reklamu), bez způsobilé anglické
 * kampaně se nezobrazí nic — obojí beze změny oproti dosavadnímu
 * chování (viz lib/ads/resolve-slot-content.ts).
 */
export function getFallbackLanguage(language: Language): Language | null {
  if (language === "de" || language === "uk") return "en";
  return null;
}
