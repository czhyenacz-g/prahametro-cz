/**
 * Anonymní technické eventy pro Mapy.com Matrix Routing — stejný vzor
 * jako `lib/parking/events.ts`/`lib/ads/events.ts` (viz zadání "pokud
 * projekt už má interní analytické události, lze přidat jen tyhle").
 * V produkci nikam nic neodesílá, jen vývojový `console.debug`. NIKDY
 * `lat`/`lon`/entranceId/URL requestu/API klíč — jen typ eventu.
 */
export type WalkingMatrixEvent =
  | { type: "walking_matrix_requested" }
  | { type: "walking_matrix_cache_hit" }
  | { type: "walking_matrix_succeeded" }
  | { type: "walking_matrix_fallback" };

export function emitWalkingMatrixEvent(event: WalkingMatrixEvent): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[walking-matrix]", event);
  }
}
