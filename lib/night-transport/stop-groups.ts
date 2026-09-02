import type { GtfsStop } from "../gtfs/types.ts";

export type NightStopGroupWarning = { kind: "missing-coordinates"; stopId: string } | { kind: "missing-group-key"; stopId: string };

/**
 * Klíč logické zastávkové skupiny pro jedno fyzické nástupiště (zadání
 * bod 7): PREFERUJ `parent_station`, pokud existuje (větší přestupní
 * uzly, ~1400 zastávek reálného feedu ho mají). Jinak spadni na
 * `asw_node_id` — stabilní PID seskupovací ID sdílené napříč nástupišti
 * BEZ `parent_station` (ověřeno na živých datech, např. "Lazarská" —
 * 4 nástupiště, žádné `parent_station`, společné `asw_node_id`).
 * NIKDY nepoužívej pouhou podobnost jména (zadání "stejnojmenné
 * zastávky na různých místech neslučuj") — jméno se tu vůbec nepoužívá
 * jako klíč, jen jako zobrazovaný popisek.
 *
 * `null`, když stop nemá ani jedno (velmi vzácný okrajový případ v
 * reálných datech — ~190 hraničních/technických bodů, žádný z nich
 * skutečně obsluhovaný noční linkou) — volající pak zachová zastávku
 * jako samostatnou (fallback na vlastní `stop_id`), viz zadání "při
 * nejednoznačném seskupení raději zachovej samostatné zastávky".
 */
export function getStopGroupKey(stop: Pick<GtfsStop, "parent_station" | "asw_node_id" | "stop_id">): string {
  if (stop.parent_station) return `parent:${stop.parent_station}`;
  if (stop.asw_node_id) return `node:${stop.asw_node_id}`;
  return `stop:${stop.stop_id}`;
}

/** Bezpečný podmnožinový vzor pro název souboru — stejná politika jako SAFE_STATION_ID ve scripts/import-pid-gtfs.ts. */
const SAFE_FILE_NAME = /^[A-Za-z0-9_-]+$/;

/**
 * `NightStopGroup.id` (např. "node:997") -> název souboru v
 * `public/data/night-transport/stops/` — JEDINÉ místo, které tuhle
 * transformaci dělá, používá jak import (scripts/import-pid-gtfs.ts,
 * při zápisu), tak klient (components/night/NightFinder.tsx, při
 * fetchi) — obě strany tak nemůžou nikdy "rozjet" jinou konvenci.
 */
export function groupIdToFileName(groupId: string): string | null {
  const safe = groupId.replace(/:/g, "_");
  return SAFE_FILE_NAME.test(safe) ? safe : null;
}
