"use client";

import { Moon } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "./i18n/I18nContext.ts";
import { NIGHT_LOCALE_TO_ROUTE } from "../lib/i18n/night-routes.ts";

export type AppFooterProps = {
  /**
   * Nenápadný odkaz nad disclaimerem (zadání bod 3) — výchozí (homepage,
   * beze změny) vede na noční sekci. Noční stránky (viz
   * components/night/NightPage.tsx) předávají opačný odkaz zpět na
   * hlavní funkci metra, ať se patička nezacyklí sama na sebe. `icon` je
   * už VYKRESLENÝ prvek (ne komponenta/funkce) — Server Component
   * (NightPage.tsx) nemůže funkci/komponentu předat přes hranici RSC
   * serializace klientské komponentě, ale hotový React element ano.
   */
  bottomLink?: { href: string; label: string; icon: ReactNode };
};

export default function AppFooter({ bottomLink }: AppFooterProps) {
  const { dict, locale } = useI18n();
  const link = bottomLink ?? { href: NIGHT_LOCALE_TO_ROUTE[locale], label: dict.footer.nightTransportLink, icon: <Moon aria-hidden="true" size={14} strokeWidth={2.25} /> };

  return (
    <footer className="mt-auto border-t border-gray-200 px-4 py-6 text-center text-xs text-gray-500 sm:text-sm">
      <p>{dict.footer.privacy}</p>
      <p className="mt-2">
        {dict.footer.dataLabel}{" "}
        <a href="https://pid.cz/opendata/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">
          PID
        </a>
        , {dict.footer.licenseWord}{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/deed.cs"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-900"
        >
          CC BY 4.0
        </a>
        .
      </p>
      <p className="mt-3">
        <a href={link.href} className="inline-flex items-center gap-1 text-gray-500 underline hover:text-gray-900">
          {link.icon}
          {link.label}
        </a>
      </p>
      <p className="mt-2 text-[11px] text-gray-400">{dict.footer.disclaimer}</p>
    </footer>
  );
}
