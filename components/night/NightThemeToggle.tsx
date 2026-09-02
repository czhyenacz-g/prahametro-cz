"use client";

import { Moon, Sun } from "lucide-react";

export type NightThemeToggleProps = {
  theme: "dark" | "light";
  onToggle: () => void;
  toNightLabel: string;
  toLightLabel: string;
};

/**
 * Přepínač nočního/světlého vzhledu (zadání bod 13) — jen tahle jedna
 * malá komponenta zná `theme`; zbytek stránky reaguje čistě přes
 * Tailwind `dark:` variantu (viz tailwind.config.ts `darkMode: "class"`
 * a components/night/NightThemeShell.tsx, který na `<div>` přepíná
 * třídu `dark`) — funguje i pro serverově vykreslený obsah beze
 * zvláštní klientské logiky v každé komponentě.
 */
export default function NightThemeToggle({ theme, onToggle, toNightLabel, toLightLabel }: NightThemeToggleProps) {
  const label = theme === "dark" ? toLightLabel : toNightLabel;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={theme === "dark"}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-navy-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {theme === "dark" ? <Sun aria-hidden="true" size={20} strokeWidth={2.25} /> : <Moon aria-hidden="true" size={20} strokeWidth={2.25} />}
    </button>
  );
}
