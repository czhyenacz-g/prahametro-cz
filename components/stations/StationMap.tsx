import { buildLocalProjection, platformAnchorId, shortEntranceLabel, spreadMarkers, type EntranceGroup } from "../../lib/stations/build-guide-view.ts";
import type { StationAreaPlatform } from "../../lib/stations/area-stops-types.ts";

const MARKER_RADIUS = 12;
/** Značky se rozestoupí, aby se nepřekrývaly ani nedotýkaly (průměr + mezera). */
const MIN_MARKER_DISTANCE = MARKER_RADIUS * 2 + 3;
const FOCUS_CLASS = "outline-none [&:focus-visible>.marker]:stroke-[#4285F4] [&:focus-visible>.marker]:[stroke-width:4]";

/**
 * Lokální mapka vstupů a povrchových stanovišť — čisté serverové SVG
 * (žádný JS, žádné mapové dlaždice ani externí služba), polohy jen z PID
 * GTFS. Každá značka je odkaz na řádek seznamu pod mapou (#vstup-…,
 * #stanoviste-…), kde je navigace. Značky blízko sebe se rozestoupí
 * (spreadMarkers) a se skutečnou polohou je spojí vodicí čára s tečkou.
 * Schéma, ne podkladová mapa — proto měřítko a sever.
 */
export default function StationMap({ name, entrances, platforms }: { name: string; entrances: readonly EntranceGroup[]; platforms: readonly StationAreaPlatform[] }) {
  const allPoints = [...entrances.flatMap((g) => g.points), ...platforms];
  if (allPoints.length === 0) return null;

  const projection = buildLocalProjection(allPoints, 400, 36, 380);
  const { width, height } = projection;
  const scaleBar = Math.round(projection.pixelsPer50m);

  const markers = [
    ...entrances.map((group) => ({ kind: "entrance" as const, key: group.anchorId, href: `#${group.anchorId}`, label: shortEntranceLabel(group.label), ariaLabel: `Vstup ${group.label}`, wheelchair: group.wheelchair, actual: projection.project(group.points[0].lat, group.points[0].lon) })),
    ...platforms.map((platform) => ({ kind: "platform" as const, key: platformAnchorId(platform.code), href: `#${platformAnchorId(platform.code)}`, label: platform.code, ariaLabel: `Stanoviště ${platform.code}`, wheelchair: false, actual: projection.project(platform.lat, platform.lon) })),
  ];
  const placed = spreadMarkers(
    markers.map((m) => m.actual),
    MIN_MARKER_DISTANCE,
    { width, height, margin: MARKER_RADIUS + 2 }
  );
  // Vedlejší body vstupu (PID eviduje u některých vstupů víc bodů) — jen malé tečky na skutečné poloze.
  const extraPoints = entrances.flatMap((group) => group.points.slice(1).map((point) => ({ key: point.id, ...projection.project(point.lat, point.lon), wheelchair: group.wheelchair })));

  return (
    <figure className="mt-3">
      <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`Schéma polohy vstupů do metra ${name} a okolních zastávek`} className="h-auto max-h-[460px] w-full rounded-xl border border-gray-200 bg-gray-50">
        {extraPoints.map((p) => (
          <circle key={p.key} cx={p.x} cy={p.y} r={3} className={p.wheelchair ? "fill-emerald-700" : "fill-navy-900"} aria-hidden="true" />
        ))}
        {markers.map((marker, index) => {
          const at = placed[index];
          const displaced = Math.hypot(at.x - marker.actual.x, at.y - marker.actual.y) > 2;
          return (
            displaced && (
              <g key={`leader-${marker.key}`} aria-hidden="true">
                <line x1={marker.actual.x} y1={marker.actual.y} x2={at.x} y2={at.y} className="stroke-gray-400" strokeWidth={1} />
                <circle cx={marker.actual.x} cy={marker.actual.y} r={2.5} className="fill-gray-500" />
              </g>
            )
          );
        })}
        {markers.map((marker, index) => {
          const { x, y } = placed[index];
          return (
            <a key={marker.key} href={marker.href} aria-label={marker.ariaLabel} className={FOCUS_CLASS}>
              {marker.kind === "platform" ? (
                <rect x={x - MARKER_RADIUS} y={y - MARKER_RADIUS} width={MARKER_RADIUS * 2} height={MARKER_RADIUS * 2} rx={5} className="marker fill-white stroke-gray-600" strokeWidth={1.5} />
              ) : (
                <circle cx={x} cy={y} r={MARKER_RADIUS} className={`marker stroke-white ${marker.wheelchair ? "fill-emerald-700" : "fill-navy-900"}`} strokeWidth={1.5} />
              )}
              <text x={x} y={y + 4} textAnchor="middle" className={`pointer-events-none text-[11px] font-bold ${marker.kind === "platform" ? "fill-gray-800" : "fill-white"}`}>
                {marker.label}
              </text>
            </a>
          );
        })}
        <g transform={`translate(${width - 12 - scaleBar}, ${height - 10})`} aria-hidden="true">
          <line x1={0} y1={0} x2={scaleBar} y2={0} className="stroke-gray-500" strokeWidth={2} />
          <text x={scaleBar / 2} y={-4} textAnchor="middle" className="fill-gray-600 text-[10px]">
            50 m
          </text>
        </g>
        <text x={10} y={18} className="fill-gray-600 text-[11px] font-bold" aria-hidden="true">
          S ↑
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-navy-900" />
          vstup do metra
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-emerald-700" />
          vstup označený PID jako bezbariérový
        </span>
        {platforms.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm border border-gray-600 bg-white" />
            stanoviště MHD
          </span>
        )}
        <span className="w-full text-gray-600">
          Schéma podle souřadnic z otevřených dat PID, bez podkladové mapy. Značky blízko sebe jsou kvůli čitelnosti odsunuté — šedá tečka s čarou ukazuje skutečnou polohu. Klepnutím na značku
          přejdete na navigaci.
        </span>
      </figcaption>
    </figure>
  );
}
