import type { MetroEntrance } from "../metro/types.ts";
import type { StationAreaPlatform } from "./area-stops-types.ts";

export type EntranceGroup = {
  /** Stabilní kotva (#vstup-…) a viditelný popisek. */
  anchorId: string;
  label: string;
  /** PID eviduje u některých vstupů víc bodů (např. dvě strany schodiště) — všechny se kreslí, popisek jen jednou. */
  points: { id: string; lat: number; lon: number }[];
  wheelchair: boolean;
};

/** "(Výtah/Lift)" -> "Výtah", jinak beze změny ("E1", "E2 (B)"). */
export function normalizeEntranceLabel(label: string): string {
  return /výtah/i.test(label) ? "Výtah" : label.trim();
}

/** Krátký popisek do značky v mapě: "E2 (B)" -> "2B", "E10" -> "10", "Výtah" -> "Vý" (ne "V" — to bývá kód stanoviště). */
export function shortEntranceLabel(label: string): string {
  if (label === "Výtah") return "Vý";
  return label.replace(/^E/, "").replace(/\s*\((\w+)\)$/, "$1").slice(0, 3);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function compareLabels(a: string, b: string): number {
  return a.localeCompare(b, "cs", { numeric: true });
}

/** Vstupy jedné stanice seskupené podle popisku (E1, E2 (B)…), seřazené přirozeně (E2 před E10). */
export function groupStationEntrances(entrances: readonly MetroEntrance[], stationId: string): EntranceGroup[] {
  const groups = new Map<string, EntranceGroup>();
  for (const entrance of entrances) {
    if (entrance.stationId !== stationId) continue;
    const label = normalizeEntranceLabel(entrance.entranceLabel);
    let group = groups.get(label);
    if (!group) groups.set(label, (group = { anchorId: `vstup-${slugify(label)}`, label, points: [], wheelchair: false }));
    group.points.push({ id: entrance.id, lat: entrance.lat, lon: entrance.lon });
    if (entrance.wheelchair === "yes") group.wheelchair = true;
  }
  return [...groups.values()].sort((a, b) => compareLabels(a.label, b.label));
}

export function platformAnchorId(code: string): string {
  return `stanoviste-${slugify(code)}`;
}

/** Stanoviště, ze kterých odjíždí daná linka — prázdné pole = linka v aktuálních datech u stanice není. */
export function findPlatformsForRoute(platforms: readonly StationAreaPlatform[], routeName: string): StationAreaPlatform[] {
  return platforms.filter((p) => p.routes.some((r) => r.name === routeName));
}

export type MapPoint = { x: number; y: number };

export type LocalProjection = {
  width: number;
  height: number;
  project: (lat: number, lon: number) => MapPoint;
  /** Délka 50 m v pixelech mapy (pro měřítko). */
  pixelsPer50m: number;
};

/**
 * Jednoduchá lokální projekce (equirectangular s korekcí cos(lat)) —
 * na pár set metrů zkreslení zanedbatelné. Výška se dopočítá z poměru
 * stran skutečných dat, sever je nahoře, `padding` drží značky dál od
 * okraje.
 */
export function buildLocalProjection(points: readonly { lat: number; lon: number }[], width = 400, padding = 28, maxHeight = 360): LocalProjection {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const midLat = (minLat + maxLat) / 2;

  const metersPerDegLat = 111_320;
  const metersPerDegLon = 111_320 * Math.cos((midLat * Math.PI) / 180);
  // Minimální rozsah 120 m, ať jednobodová/malá stanice nezvětší pár metrů přes celou mapu.
  const spanX = Math.max((maxLon - minLon) * metersPerDegLon, 120);
  const spanY = Math.max((maxLat - minLat) * metersPerDegLat, 80);

  const innerWidth = width - padding * 2;
  let scale = innerWidth / spanX;
  let height = spanY * scale + padding * 2;
  if (height > maxHeight) {
    scale = (maxHeight - padding * 2) / spanY;
    height = maxHeight;
  }

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = midLat;

  return {
    width,
    height: Math.round(height),
    pixelsPer50m: 50 * scale,
    project: (lat, lon) => ({
      x: width / 2 + (lon - centerLon) * metersPerDegLon * scale,
      y: height / 2 - (lat - centerLat) * metersPerDegLat * scale,
    }),
  };
}

/**
 * Rozestoupení překrývajících se značek v mapě (Můstek, Letňany mají
 * vstupy a stanoviště pár metrů od sebe). Jednoduchá deterministická
 * relaxace: dvojice blíž než `minDistance` se odtlačí od sebe; skutečná
 * poloha zůstává vstupem a mapa k ní nakreslí vodicí čáru. Výsledek je
 * oříznutý do mapy s okrajem `margin`.
 */
export function spreadMarkers(points: readonly MapPoint[], minDistance: number, bounds: { width: number; height: number; margin: number }, iterations = 60): MapPoint[] {
  const placed = points.map((p) => ({ ...p }));
  for (let iteration = 0; iteration < iterations; iteration++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        let dx = placed[j].x - placed[i].x;
        let dy = placed[j].y - placed[i].y;
        let distance = Math.hypot(dx, dy);
        if (distance >= minDistance) continue;
        if (distance < 0.01) {
          // Totožné body — deterministický směr podle indexu.
          const angle = (j * 2.399963) % (2 * Math.PI);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }
        const push = (minDistance - distance) / 2;
        const ux = dx / distance;
        const uy = dy / distance;
        placed[i].x -= ux * push;
        placed[i].y -= uy * push;
        placed[j].x += ux * push;
        placed[j].y += uy * push;
        moved = true;
      }
    }
    for (const p of placed) {
      p.x = Math.min(Math.max(p.x, bounds.margin), bounds.width - bounds.margin);
      p.y = Math.min(Math.max(p.y, bounds.margin), bounds.height - bounds.margin);
    }
    if (!moved) break;
  }
  return placed;
}
