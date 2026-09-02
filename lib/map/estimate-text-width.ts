// Hrubý odhad šířky vykresleného jména stanice v SVG <text> — bez
// přístupu k reálnému měření (getBBox by fungovalo jen po mountu v
// prohlížeči a způsobilo by "naskočení" podtržení až po prvním renderu).
// Přesnost na pixel není potřeba, jde jen o délku podtržítka pod jménem
// stanice (viz MetroMapSvg.tsx) — mírné podstřelení/přestřelení nevadí.
// Kalibrováno na fontSize=20 s výchozím sans-serif stackem prohlížeče.
const AVG_CHAR_WIDTH_REGULAR = 10.6;
const AVG_CHAR_WIDTH_BOLD = 11.4;

export function estimateTextWidth(name: string, bold: boolean): number {
  const perChar = bold ? AVG_CHAR_WIDTH_BOLD : AVG_CHAR_WIDTH_REGULAR;
  return name.length * perChar;
}
