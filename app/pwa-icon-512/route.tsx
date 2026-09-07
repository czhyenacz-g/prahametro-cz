import { ImageResponse } from "next/og";
import { MetroIconGraphic } from "../../lib/pwa/icon-graphic.tsx";

const SIZE = 512;

// Viz app/pwa-icon-192/route.tsx pro vysvětlení, proč vlastní route
// handler místo next/next app/icon.tsx konvence a proč "force-static".
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<MetroIconGraphic size={SIZE} />, { width: SIZE, height: SIZE });
}
