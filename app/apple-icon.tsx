import { ImageResponse } from "next/og";
import { MetroIconGraphic } from "../lib/pwa/icon-graphic.tsx";

// Next.js file-convention ikona (viz app/icon.tsx pro favicon) —
// automaticky vygeneruje <link rel="apple-touch-icon"> ve všech čtyřech
// jazykových "root" layoutech (žádné ruční metadata.icons, viz zadání
// bod 4 "nevkládej zastaralé HTML ručně"). 180×180 = doporučená
// velikost Apple touch icon; Apple sám aplikuje zaoblení rohů, proto
// stejná "full-bleed" grafika jako obyčejná (nemaskable) PWA ikona.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<MetroIconGraphic size={180} />, { ...size });
}
