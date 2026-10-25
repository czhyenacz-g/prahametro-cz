/**
 * stationId → slug průvodce (/stanice/<slug>) — samostatně a malé, aby se
 * do klientského bundlu výsledků hledání netahal celý obsah průvodců
 * (lib/stations/guides.ts). Shodu s STATION_GUIDES hlídá
 * test/station-guides.test.ts.
 */
export const GUIDE_SLUG_BY_STATION_ID: Readonly<Record<string, string>> = {
  U689S1: "florenc",
  U897S1: "cerny-most",
  U1072S1: "mustek",
  U400S1: "muzeum",
  U462S1: "nadrazi-veleslavin",
  U1141S1: "zlicin",
  U286S1: "haje",
  U1000S1: "letnany",
};

export function stationGuideHref(stationId: string): string | null {
  const slug = GUIDE_SLUG_BY_STATION_ID[stationId];
  return slug ? `/stanice/${slug}` : null;
}
