import NightHeader from "./NightHeader.tsx";

export type NightThemeShellProps = {
  mainHeading: string;
  children: React.ReactNode;
};

/**
 * Noční sekce má VŽDY tmavý vzhled (na rozdíl od dřívější verze s
 * lokálním přepínačem) — dřívější přepínač noční/denní vzhled se
 * změnil na skutečnou navigaci zpět na metro (denní vzhled), viz
 * components/HeaderModeSwitchLink.tsx a NightHeader.tsx. Třída `dark`
 * je tu proto napevno, obaluje CELÝ obsah stránky (hlavičku i
 * serverově vykreslený SEO obsah, viz components/night/NightPage.tsx)
 * do jednoho `<div>` — potomci (klidně i Server Components předané
 * jako `children`) reagují čistě přes Tailwind `dark:` variantu.
 */
export default function NightThemeShell({ mainHeading, children }: NightThemeShellProps) {
  return (
    <div className="dark">
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950">
        <NightHeader mainHeading={mainHeading} />
        {children}
      </div>
    </div>
  );
}
