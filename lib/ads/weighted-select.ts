/** Vrací číslo v [0, 1) — stejný kontrakt jako Math.random. */
export type RandomSource = () => number;

function isValidWeight(weight: number): boolean {
  return Number.isFinite(weight) && weight > 0;
}

/**
 * Čistá, samostatně testovatelná vážená volba (viz zadání) — kampaň s
 * `weight: 70` má mezi kampaněmi s celkovou vahou 100 přibližně 70%
 * šanci. Kampaně s neplatnou vahou (0, záporná, NaN, Infinity) se
 * nikdy nevyberou. `random` je injectovatelný kvůli deterministickým
 * testům; produkční volání (lib/ads/select-ad.ts) používá `Math.random`.
 */
export function weightedSelect<T extends { weight: number }>(items: T[], random: RandomSource = Math.random): T | null {
  const valid = items.filter((item) => isValidWeight(item.weight));
  if (valid.length === 0) return null;

  const total = valid.reduce((sum, item) => sum + item.weight, 0);
  const roll = random() * total;

  let cumulative = 0;
  for (const item of valid) {
    cumulative += item.weight;
    if (roll < cumulative) return item;
  }

  // Pojistka proti plovoucí desetinné nepřesnosti (roll velmi blízko total).
  return valid[valid.length - 1];
}
