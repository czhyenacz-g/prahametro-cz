import { LINE_HEX } from "../metro/line-colors.ts";
import { PWA_THEME_COLOR } from "./config.ts";

/**
 * Sdílená grafika pro všechny "přidat na plochu" ikony (192, 512,
 * maskable 512, Apple touch icon) — stejný motiv jako existující
 * favicon (app/icon.tsx, viz audit): tři tečky v barvách linek A/B/C
 * nad tmavým pozadím. Vykresluje se přes `next/og` ImageResponse
 * (satori), proto jen inline styly, žádné Tailwind třídy (satori je
 * nezná).
 *
 * `maskable=true` zmenší shluk teček na cca 45 % plochy (uvnitř
 * bezpečné zóny ~80 % podle W3C maskable icons spec), aby Android
 * adaptivní ikona nic neoříznula. Bez `maskable` (běžná ikona i Apple
 * touch icon) je pozadí "full-bleed" čtverec BEZ zaobleného rohu —
 * zaoblení/masku si aplikuje sám systém (iOS squircle, Android
 * launcher), zdvojené zaoblení by ikonu jen zbytečně zmenšilo.
 */
export function MetroIconGraphic({ size, maskable = false }: { size: number; maskable?: boolean }) {
  const dotSize = Math.round(size * (maskable ? 0.11 : 0.15));
  const gap = Math.round(size * (maskable ? 0.05 : 0.07));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PWA_THEME_COLOR,
      }}
    >
      <div style={{ display: "flex", gap }}>
        <div style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: LINE_HEX.A }} />
        <div style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: LINE_HEX.B }} />
        <div style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: LINE_HEX.C }} />
      </div>
    </div>
  );
}
