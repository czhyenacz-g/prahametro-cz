/**
 * Extrahováno jako čistá funkce, aby šlo přímo otestovat, že demo
 * ovládání je logicky vázané jen na development (viz zadání "ověř
 * nepřítomnost demo ovládání v production buildu"). Next.js/webpack
 * navíc `process.env.NODE_ENV === "development"` staticky nahradí a
 * mrtvou větev v produkčním bundlu úplně odstraní (ověřeno reálným
 * `next build` — viz README).
 */
export function shouldShowDemoControls(nodeEnv: string | undefined): boolean {
  return nodeEnv === "development";
}
