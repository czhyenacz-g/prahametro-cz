import lineOrderData from "../../data/metro-line-order.json" with { type: "json" };
import type { MetroLine } from "../metro/types.ts";

export type Point = { x: number; y: number };

export type StationNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  lines: MetroLine[];
};

export type LineTrack = {
  line: MetroLine;
  stationIds: string[];
};

type LineOrderEntry = { stationId: string; stationName: string };
type LineOrderData = { generatedAt: string; lines: Record<MetroLine, LineOrderEntry[]> };

const data = lineOrderData as LineOrderData;

// Schematické ukotvovací body tří přestupních stanic historického centra
// (Muzeum, Můstek, Florenc — reálně tvoří malý trojúhelník, to jediné
// odpovídá skutečné topologii). Souřadnice samotné jsou naše prezentační
// vrstva ("rozložení mapy je naše vlastní prezentační vrstva", viz
// zadání) — NE z GTFS. Jména stanic pro dohledání kotev jsou ale
// dohledávaná v reálných datech (data/metro-line-order.json), ne
// natvrdo indexem, ať layout přežije budoucí `npm run data:refresh`
// i při menších změnách pořadí/vynechaných stanicích.
// Vzdálenosti mezi kotvami zdvojené (+100 %) oproti původnímu trojúhelníku
// (byl 400,430 / 440,470 / 460,380) — škálováno stejnoměrně od jeho
// těžiště (433,427), ať si trojúhelník zachová tvar i orientaci. Protože
// se z těchto tří bodů lineárně odvozuje rozestup VŠECH stanic na dané
// lince (viz layoutLinePositions níže), zdvojení kotev zdvojí rozestup
// stanic v celé mapě, nejvýrazněji viditelné právě v nejhustší centrální
// přestupní oblasti (viz zadání "stanice ve střední části dál od sebe").
const MUSTEK: Point = { x: 367, y: 433 };
const MUZEUM: Point = { x: 447, y: 513 };
const FLORENC: Point = { x: 487, y: 333 };

type AnchorSpec = { stationName: string; point: Point };

const LINE_ANCHORS: Record<MetroLine, [AnchorSpec, AnchorSpec] | null> = {
  A: [
    { stationName: "Můstek", point: MUSTEK },
    { stationName: "Muzeum", point: MUZEUM },
  ],
  B: [
    { stationName: "Můstek", point: MUSTEK },
    { stationName: "Florenc", point: FLORENC },
  ],
  C: [
    { stationName: "Muzeum", point: MUZEUM },
    { stationName: "Florenc", point: FLORENC },
  ],
  // Linka D zatím nemá provoz (viz zadání) — žádné kotvy, žádné stanice
  // v layoutu, dokud GTFS neobsahuje skutečné route_type=1 spoje "D".
  D: null,
};

function layoutLinePositions(order: LineOrderEntry[], anchors: [AnchorSpec, AnchorSpec]): Map<string, Point> {
  const index1 = order.findIndex((s) => s.stationName === anchors[0].stationName);
  const index2 = order.findIndex((s) => s.stationName === anchors[1].stationName);

  if (index1 === -1 || index2 === -1 || index1 === index2) {
    throw new Error(
      `Kotevní stanice pro schematickou mapu nebyla nalezena v datech (${anchors[0].stationName} / ${anchors[1].stationName}).`
    );
  }

  const steps = index2 - index1;
  const dx = (anchors[1].point.x - anchors[0].point.x) / steps;
  const dy = (anchors[1].point.y - anchors[0].point.y) / steps;

  const positions = new Map<string, Point>();
  for (let i = 0; i < order.length; i++) {
    const stepsFromAnchor1 = i - index1;
    positions.set(order[i].stationId, {
      x: anchors[0].point.x + dx * stepsFromAnchor1,
      y: anchors[0].point.y + dy * stepsFromAnchor1,
    });
  }
  return positions;
}

function buildStationLayout(): { nodes: StationNode[]; tracks: LineTrack[]; viewBox: { width: number; height: number; minX: number; minY: number } } {
  const nodesById = new Map<string, StationNode>();
  const tracks: LineTrack[] = [];

  for (const line of Object.keys(LINE_ANCHORS) as MetroLine[]) {
    const order = data.lines[line];
    const anchors = LINE_ANCHORS[line];
    if (!order || order.length === 0 || !anchors) continue;

    const positions = layoutLinePositions(order, anchors);
    tracks.push({ line, stationIds: order.map((s) => s.stationId) });

    for (const entry of order) {
      const point = positions.get(entry.stationId)!;
      const existing = nodesById.get(entry.stationId);
      if (existing) {
        if (!existing.lines.includes(line)) existing.lines.push(line);
      } else {
        nodesById.set(entry.stationId, { id: entry.stationId, name: entry.stationName, x: point.x, y: point.y, lines: [line] });
      }
    }
  }

  const nodes = [...nodesById.values()];
  const padding = 60;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;

  return { nodes, tracks, viewBox: { minX, minY, width: maxX - minX, height: maxY - minY } };
}

export const stationLayout = buildStationLayout();

export const stationNodesById = new Map(stationLayout.nodes.map((n) => [n.id, n] as const));
