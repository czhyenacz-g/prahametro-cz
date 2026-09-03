import type { GolemioParkingTariff } from "./golemio-types.ts";

const SECONDS_PER_DAY = 86_400;

/**
 * Cena za prvních 24 hodin — POUZE pro bezpečně/jednoznačně čitelné
 * případy (viz zadání "pokud ji API spolehlivě poskytuje"), nikdy
 * odhad. Ověřeno na živých tarifech Golemio 2026-09-03:
 * - `free_of_charge: true` → "Zdarma" (např. Běchovice, Radotín).
 * - JEDNA charge_band s JEDNÍM charge, jehož `charge_interval` je
 *   přesně 86 400 s (24 h) → "{částka} Kč / 24 hodin" (typický případ
 *   pražských P+R — jednotný denní paušál, žádné patrové/hodinové sazby).
 * Cokoliv složitější (víc charge bands, hodinová sazba jako u Roztyl
 * — 50 Kč/3600 s, víceúrovňové tarify) by vyžadovalo dopočítávat
 * kumulativní cenu přes `max_iterations_of_charge` — riziko chybného
 * výpočtu bez možnosti to ověřit proti realitě, proto raději `null`.
 */
export function derivePriceLabel(tariff: GolemioParkingTariff | null): string | null {
  if (!tariff?.charge_bands || tariff.charge_bands.length !== 1) return null;

  const band = tariff.charge_bands[0];
  if (band.free_of_charge === true) return "Zdarma";

  if (!band.charges || band.charges.length !== 1) return null;
  const charge = band.charges[0];
  if (charge.charge_interval !== SECONDS_PER_DAY) return null;

  const amount = Number(charge.charge);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return `${amount} Kč / 24 hodin`;
}
