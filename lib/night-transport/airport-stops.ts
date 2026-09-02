import type { NightStopDetail } from "./types.ts";

/**
 * Stabilní PID "uzly" (asw_node_id) zastávek Letiště Václava Havla —
 * PRIMÁRNÍ signál pro rozpoznání letištních spojů (zadání bod 2,
 * "stabilní identifikátory... než normalizovaný název"). Ověřeno na
 * živém PID GTFS feedu (2026-09, `npm run data:refresh`):
 *
 *  - node:628  "Terminál 1" — reálné nástupiště linek 907 i 910.
 *    Název NEOBSAHUJE "letiště" vůbec (viz zadání "proč report
 *    opomenul 907") — čistě textová detekce by ho proto nikdy
 *    nenašla, i když jde nezpochybnitelně o letištní zastávku.
 *  - node:629  "Terminál 2" — stejný případ jako Terminál 1, obsluhují
 *    obě linky 907 i 910.
 *  - node:1090 "Letiště" — v aktuálním jízdním řádu je to VŽDY jen
 *    poslední (= příjezdová) zastávka spoje, takže v datasetu nikdy
 *    nevznikne jako platforma s odjezdem (viz build-night-dataset.ts,
 *    pravidlo "poslední zastávka = jen příjezd") — přesto v seznamu
 *    pro případ budoucí změny trasy.
 *  - node:218  "K Letišti" — průjezdní zastávka na trase linky 910.
 *
 * Tenhle seznam je jediné místo, které je potřeba upravit, pokud PID
 * v budoucnu letištní uzly přejmenuje nebo přečísluje síť — číslo
 * linky ani headsign spoje se k rozpoznání vůbec nepoužívají.
 */
export const KNOWN_AIRPORT_STOP_GROUP_IDS: ReadonlySet<string> = new Set(["node:628", "node:629", "node:1090", "node:218"]);

/**
 * Bezpečný FALLBACK (zadání bod 2, tier 3) pro zastávkové skupiny mimo
 * výše uvedený seznam — např. budoucí nová letištní zastávka, kterou
 * seznam ještě neobsahuje. Jen kmen "letišt" (bez koncovky), protože
 * čeština skloňuje "Letiště"/"K Letišti"/"Letištěm" atd. NIKDY se
 * nepoužívá jako jediný/primární signál — viz `isAirportStopGroup`.
 */
const AIRPORT_NAME_FALLBACK_PATTERN = /letišt/i;

/**
 * Je zastávková skupina součástí letiště? Primárně podle stabilního
 * `groupId` (viz `KNOWN_AIRPORT_STOP_GROUP_IDS`), teprve pak podle
 * normalizovaného názvu jako fallback. Nikdy podle čísla linky,
 * headsignu ani směru jízdy — o tom, jestli konkrétní linka letiště
 * obsluhuje, rozhoduje výhradně to, že v aktuálních datech skutečně
 * zastavuje na takhle rozpoznané zastávce (viz build-night-dataset.ts).
 */
export function isAirportStopGroup(groupId: string, groupName: string): boolean {
  if (KNOWN_AIRPORT_STOP_GROUP_IDS.has(groupId)) return true;
  return AIRPORT_NAME_FALLBACK_PATTERN.test(groupName);
}

export type AirportRouteReport = { line: string; stopNames: string[] };

/**
 * Auditní přehled "která noční linka obsluhuje které letištní
 * zastávky" — čistě pro výpis při importu (zadání bod 3, "Airport
 * night routes: ..."), nikdy se neukládá do public/data/night-transport
 * (ten dál nese jen `airportLines: string[]`, beze změny tvaru).
 * Postavené přímo nad hotovým `stopDetails`, takže vždy odpovídá
 * skutečně vygenerovanému datasetu, ne odděleně dopočítané hodnotě.
 */
export function buildAirportRouteReport(stopDetails: ReadonlyMap<string, NightStopDetail>): AirportRouteReport[] {
  const stopNamesByLine = new Map<string, Set<string>>();

  for (const detail of stopDetails.values()) {
    if (!isAirportStopGroup(detail.id, detail.name)) continue;

    for (const route of detail.routes) {
      if (!stopNamesByLine.has(route.shortName)) stopNamesByLine.set(route.shortName, new Set());
      stopNamesByLine.get(route.shortName)!.add(detail.name);
    }
  }

  return [...stopNamesByLine.entries()]
    .map(([line, stopNames]) => ({ line, stopNames: [...stopNames].sort((a, b) => a.localeCompare(b, "cs")) }))
    .sort((a, b) => a.line.localeCompare(b.line, undefined, { numeric: true }));
}
