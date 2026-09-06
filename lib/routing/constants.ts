// Sdílené konstanty pro zpřesnění nejbližších vstupů skutečnou pěší
// trasou přes Mapy.com Matrix Routing (viz zadání) — importuje jak výběr
// kandidátů (select-walking-route-candidates.ts), tak orchestrující hook
// (hooks/useMetroFinderResults.ts) a jejich testy, ať limity nejdou
// nikde omylem rozjet do dvou různých hodnot.

/** Kolik nejbližších RŮZNÝCH stanic (podle vzdušné vzdálenosti) vstupuje do výběru kandidátů pro matrix routing. */
export const WALKING_MATRIX_STATION_LIMIT = 6;

/** Nejvýš tolik nejbližších vstupů z KAŽDÉ vybrané stanice (viz zadání "nesmí zaplnit shortlist jedna stanice"). */
export const WALKING_MATRIX_ENTRANCES_PER_STATION = 2;

/** WALKING_MATRIX_STATION_LIMIT × WALKING_MATRIX_ENTRANCES_PER_STATION — jeden matrix request, max 12 cílů (Mapy.com limit je 100, tohle je naše mnohem nižší praktické omezení). */
export const WALKING_MATRIX_MAX_DESTINATIONS = WALKING_MATRIX_STATION_LIMIT * WALKING_MATRIX_ENTRANCES_PER_STATION;

/** Timeout jednoho matrix requestu (viz zadání "přibližně 4 sekundy"). */
export const WALKING_MATRIX_TIMEOUT_MS = 4_000;

/** Kolik nejbližších vstupů (vzdušně, bez ohledu na stanici) se drží po ruce jako zásobník pro doplnění neúplného routovaného výsledku (viz zadání bod 8) — musí bezpečně pokrýt i případ, kdy jsou oba routované výsledky z jiných stanic než zbytek zásobníku. */
export const WALKING_MATRIX_FALLBACK_POOL_LIMIT = 20;

/** Přesná hodnota potvrzená technickou dokumentací (OpenAPI spec https://api.mapy.com/v1/docs/routing/openapi.json, enum RouteType) — "rychlá pěší trasa". */
export const MAPY_ROUTE_TYPE_FOOT_FAST = "foot_fast";

/** `GET`, viz OpenAPI spec `/v1/routing/matrix-m` — jeden origin (`starts`) × max 12 cílů (`ends`) najednou. */
export const MAPY_MATRIX_ENDPOINT = "https://api.mapy.com/v1/routing/matrix-m";
