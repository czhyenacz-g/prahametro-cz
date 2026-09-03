/**
 * Skloňování počtu parkovacích míst — viz zadání "správné skloňování
 * počtu míst". Jen nominativní tvar (počítaný předmět stojí samostatně,
 * např. "Kapacita: {n} míst") — věty jako "X z Y míst volných" mají
 * pevně daný tvar přímo ze zadání (Y je v praxi vždy desítky/stovky u
 * všech reálných pražských P+R, viz docs/PARKING.md), takže se tam
 * používá přímo tvar "míst"/"places"/"Plätze"/"місць" bez dalšího
 * skloňování druhého čísla.
 */
export function czechPlaceCount(n: number): string {
  const abs = Math.abs(n);
  if (abs === 1) return `${n} místo`;
  if (abs >= 2 && abs <= 4) return `${n} místa`;
  return `${n} míst`;
}

export function englishPlaceCount(n: number): string {
  return `${n} ${Math.abs(n) === 1 ? "space" : "spaces"}`;
}

export function germanPlaceCount(n: number): string {
  return `${n} ${Math.abs(n) === 1 ? "Platz" : "Plätze"}`;
}

/** Dativ (po "von") potřebuje "-n" v plurálu — "von 3 Plätzen", ne "von 3 Plätze". */
export function germanPlaceCountDative(n: number): string {
  return `${n} ${Math.abs(n) === 1 ? "Platz" : "Plätzen"}`;
}

/** Ukrajinština má navíc výjimku pro "teens" (11–14 vždy "місць"), na rozdíl od češtiny. */
export function ukrainianPlaceCount(n: number): string {
  const abs = Math.abs(n);
  const lastTwo = abs % 100;
  const last = abs % 10;

  if (last === 1 && lastTwo !== 11) return `${n} місце`;
  if (last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return `${n} місця`;
  return `${n} місць`;
}
