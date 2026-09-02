import { estimateTextWidth } from "../../lib/map/estimate-text-width.ts";
import { stationLayout, stationNodesById } from "../../lib/map/station-layout.ts";
import { LINE_HEX } from "../../lib/metro/line-colors.ts";

const TRACK_WIDTH = 7;
const STATION_RADIUS = 6;
const INTERCHANGE_RADIUS = 9;

export type MetroMapSvgProps = {
  currentViewBox: string;
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  ariaLabel: string;
  getStationAriaLabel: (stationName: string, lines: string) => string;
  /** Tři nejbližší RŮZNÉ stanice — jen podtržení jména, nic jiného (viz zadání). */
  highlightedStationIds: ReadonlySet<string>;
};

// Podtržení jména nejbližší stanice je kreslené jako vlastní <line>, NE
// přes CSS text-decoration na <text> — SVG <text> kombinuje decoration
// line se stroke/paintOrder nastaveným na halo efekt (bílý obrys textu
// kvůli čitelnosti nad tratí), takže tenká/středně silná decoration
// linka v praxi zaniká v tom samém bílém obtahu a je skoro neviditelná
// (ověřeno — zesílení CSS podtržení na <text> samo o sobě nepomohlo).
// Samostatná <line> se svou vlastní barvou/tloušťkou tímhle efektem
// vůbec neprochází. Modrá je záměrně mimo paletu čtyř linek (A zelená,
// B zlatá, C červená, D fialová), ať podtržení nikdy nepůsobí jako
// barva linky.
const HIGHLIGHT_UNDERLINE_COLOR = "#2563EB";
const HIGHLIGHT_UNDERLINE_THICKNESS = 4;
const HIGHLIGHT_UNDERLINE_OFFSET = 6;

// Čistě prezentační SVG vrstva — žádný vlastní React stav (ten drží
// MetroMap.tsx / useMapZoomPan.ts), jen vykreslení podle dodaného
// viewBoxu. Vlastní schematické rozložení (station-layout.ts), ne
// převzatá mapa/PNG/PDF DPP. Přeložené popisky přicházejí jako props
// (žádná i18n závislost přímo tady, viz zadání "žádný nový design
// systém" — komponenta zůstává čistě prezentační).
export default function MetroMapSvg({
  currentViewBox,
  selectedStationId,
  onSelectStation,
  ariaLabel,
  getStationAriaLabel,
  highlightedStationIds,
}: MetroMapSvgProps) {
  return (
    <svg viewBox={currentViewBox} className="h-full w-full touch-none select-none" role="img" aria-label={ariaLabel}>
      {stationLayout.tracks.map((track) => {
        const points = track.stationIds
          .map((id) => stationNodesById.get(id))
          .filter((n): n is NonNullable<typeof n> => Boolean(n))
          .map((n) => `${n.x},${n.y}`)
          .join(" ");
        return (
          <polyline
            key={track.line}
            points={points}
            fill="none"
            stroke={LINE_HEX[track.line]}
            strokeWidth={TRACK_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {stationLayout.nodes.map((node) => {
        const isInterchange = node.lines.length > 1;
        const isSelected = node.id === selectedStationId;
        const isHighlighted = highlightedStationIds.has(node.id);
        const radius = isInterchange ? INTERCHANGE_RADIUS : STATION_RADIUS;

        return (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={radius + 6}
              fill="transparent"
              className="cursor-pointer"
              tabIndex={0}
              role="button"
              aria-label={getStationAriaLabel(node.name, node.lines.join(", "))}
              onClick={() => onSelectStation(node.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectStation(node.id);
                }
              }}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={radius}
              fill="white"
              stroke={isSelected ? "#111827" : LINE_HEX[node.lines[0]]}
              strokeWidth={isSelected ? 4 : 3}
              pointerEvents="none"
            />
            <text
              x={node.x + radius + 6}
              y={node.y + 5}
              fontSize={20}
              fontWeight={isInterchange ? 700 : 500}
              fill="#1f2937"
              pointerEvents="none"
              style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 5 }}
            >
              {node.name}
            </text>
            {isHighlighted && (
              <line
                x1={node.x + radius + 6}
                y1={node.y + 5 + HIGHLIGHT_UNDERLINE_OFFSET}
                x2={node.x + radius + 6 + estimateTextWidth(node.name, isInterchange)}
                y2={node.y + 5 + HIGHLIGHT_UNDERLINE_OFFSET}
                stroke={HIGHLIGHT_UNDERLINE_COLOR}
                strokeWidth={HIGHLIGHT_UNDERLINE_THICKNESS}
                strokeLinecap="round"
                pointerEvents="none"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
