"use client";

import { useNightTheme } from "../../hooks/useNightTheme.ts";
import NightHeader from "./NightHeader.tsx";

export type NightThemeShellProps = {
  /** Prostý string, ne funkce — Server Component (NightPage.tsx) nemůže funkci předat Client Componentě přes hranici RSC serializace. */
  mainHeading: string;
  children: React.ReactNode;
};

/**
 * Jediné místo, které zná stav `theme` (zadání bod 13) — obaluje CELÝ
 * obsah noční stránky (hlavičku i serverově vykreslený SEO obsah, viz
 * components/night/NightPage.tsx) do jednoho `<div>`, na který se
 * přepíná třída `dark`. Potomci (klidně i Server Components předané
 * jako `children` — Next.js je nepřevede na klientské, viz stejný
 * vzorec u HomePage.tsx/I18nProvider.tsx a `<SeoContent>`) pak reagují
 * čistě přes Tailwind `dark:` variantu, BEZ vlastní klientské logiky.
 * `NightHeader` (potřebuje `theme`/`toggle`) se vykresluje PŘÍMO tady,
 * ne přes render-prop předaný ze serveru.
 */
export default function NightThemeShell({ mainHeading, children }: NightThemeShellProps) {
  const { theme, toggle } = useNightTheme();

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950">
        <NightHeader mainHeading={mainHeading} theme={theme} onToggleTheme={toggle} />
        {children}
      </div>
    </div>
  );
}
