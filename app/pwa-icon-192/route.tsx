import { ImageResponse } from "next/og";
import { MetroIconGraphic } from "../../lib/pwa/icon-graphic.tsx";

const SIZE = 192;

// Vlastní route handler (ne app/icon.tsx konvence next/next) — potřebujeme
// stabilní URL beze změny, na kterou se dá odkázat z app/manifest.ts
// (icons[].src). Viz lib/pwa/icon-graphic.tsx pro sdílenou grafiku.
// "force-static" — obrázek je čistá funkce velikosti, žádný request-time
// vstup, ať se vygeneruje jednou při buildu (stejně jako app/icon.tsx).
export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<MetroIconGraphic size={SIZE} />, { width: SIZE, height: SIZE });
}
