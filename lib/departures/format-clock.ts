/**
 * Sekundy od půlnoci (i > 86400, GTFS "přes půlnoc") na "HH:MM" reálného
 * hodinového času, ne na syrovou GTFS hodnotu (uživatel chce vidět
 * "00:15", ne "24:15") — viz zadání příklad formátu odjezdů.
 */
export function formatClockTime(secondsSinceMidnight: number): string {
  const normalized = ((secondsSinceMidnight % 86_400) + 86_400) % 86_400;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
