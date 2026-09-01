/**
 * Které stanice appky (podle `MetroEntrance.stationId`, viz
 * data/metro-entrances.json) NEMAJÍ odpovídající vygenerovaný soubor
 * odjezdů — import skript tohle považuje za fatální chybu (viz zadání
 * "neplatné nebo chybějící vazby způsobí kontrolovanou chybu importu,
 * nikoliv tiché zobrazení cizích odjezdů"), ne tichý fallback.
 */
export function findMissingStationCoverage(appStationIds: ReadonlySet<string>, departuresStationIds: ReadonlySet<string>): string[] {
  return [...appStationIds].filter((id) => !departuresStationIds.has(id)).sort();
}
