const WALK_SPEED_M_PER_MIN = 80;

/** "850 m" / "1,2 km" — od 1 km v kilometrech, viz zadání. */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toLocaleString("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

/** "cca 4 min pěšky" — rychlost 80 m/min, zaokrouhleno nahoru (viz zadání, přesný formát). */
export function formatWalkingTime(meters: number): string {
  const minutes = Math.ceil(meters / WALK_SPEED_M_PER_MIN);
  return `cca ${minutes} min pěšky`;
}
