import type { AdCampaign, AdResolutionState, Language } from "./types.ts";

/**
 * Co se má na reklamní pozici vykreslit — čistá funkce oddělená od
 * Reactu (viz components/ads/AdSlot.tsx), ať jde otestovat bez DOM.
 * Přání se jmeninami NENÍ součástí reklamní rotace/vah — je to čistě
 * prezentační rozhodnutí až nad výsledkem výběru reklamy.
 */
export type SlotContent = { kind: "pending" } | { kind: "ad"; campaign: AdCampaign } | { kind: "nameday" } | { kind: "none" };

/**
 * `pending` → zatím nic (viz zadání — ať neprobliknou obě varianty);
 * `selected` → reklama; `empty` a čeština → přání se jmeninami;
 * `empty` a jiný jazyk → nic (fallback je jen český, viz zadání).
 */
export function resolveSlotContent(resolution: AdResolutionState, language: Language): SlotContent {
  if (resolution.status === "pending") return { kind: "pending" };
  if (resolution.status === "selected") return { kind: "ad", campaign: resolution.campaign };
  if (language === "cs") return { kind: "nameday" };
  return { kind: "none" };
}
