import { ImageResponse } from "next/og";
import { MetroIconGraphic } from "../../lib/pwa/icon-graphic.tsx";

const SIZE = 512;

// Maskable varianta (purpose: "maskable" v app/manifest.ts) — obsah je
// zmenšený do bezpečné zóny, viz lib/pwa/icon-graphic.tsx, aby ho
// Android adaptivní ikona neoříznula při aplikaci vlastní masky/tvaru.
// Viz app/pwa-icon-192/route.tsx pro vysvětlení "force-static".
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<MetroIconGraphic size={SIZE} maskable />, { width: SIZE, height: SIZE });
}
