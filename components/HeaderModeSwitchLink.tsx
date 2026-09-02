"use client";

import { Moon, Sun } from "lucide-react";

export type HeaderModeSwitchLinkProps = {
  href: string;
  label: string;
  /** "to-night" = homepage → noční sekce (měsíc), "to-day" = noční sekce → homepage (slunce). */
  direction: "to-night" | "to-day";
};

/**
 * Přepínač mezi hlavní funkcí metra (denní/světlý vzhled) a noční
 * sekcí (vždy tmavý vzhled) — skutečná navigace na jinou stránku, ne
 * lokální přepnutí tématu (na rozdíl od dřívějšího NightThemeToggle).
 * Vizuálně stejný jako ostatní dvě tlačítka v hlavičce (LanguageMenu,
 * VulgarToggle) — stejný tap target, na noční stránce reaguje na
 * `dark:` variantu stejně jako zbytek hlavičky (žádná vlastní klientská
 * logika navíc).
 */
export default function HeaderModeSwitchLink({ href, label, direction }: HeaderModeSwitchLinkProps) {
  const Icon = direction === "to-night" ? Moon : Sun;

  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-navy-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      <Icon aria-hidden="true" size={20} strokeWidth={2.25} />
    </a>
  );
}
