"use client";

import { Map, MapPin, Navigation } from "lucide-react";

export type MapNavigationButtonsProps = {
  googleUrl: string | null;
  appleUrl: string | null;
  mapyUrl: string | null;
  googleLabel: string;
  appleLabel: string;
  mapyLabel: string;
  googleAriaLabel: string;
  appleAriaLabel: string;
  mapyAriaLabel: string;
};

/**
 * Trojice navigačních tlačítek Google Maps / Apple Maps / Mapy.com —
 * vytažené z components/EntranceResultCard.tsx (metro), aby stejný
 * vzhled a chování sdílela i noční sekce (components/night/NightResultCard.tsx),
 * viz zadání bod 12 "tři mapová tlačítka zůstanou vedle sebe stejně
 * jako na homepage". `href={null}` (neplatné/chybějící souřadnice,
 * mapovací službu nelze otevřít) vykreslí zakázané, ale viditelné
 * tlačítko — nikdy tlačítko nezmizí.
 */
export default function MapNavigationButtons({
  googleUrl,
  appleUrl,
  mapyUrl,
  googleLabel,
  appleLabel,
  mapyLabel,
  googleAriaLabel,
  appleAriaLabel,
  mapyAriaLabel,
}: MapNavigationButtonsProps) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
      <NavigationButton href={googleUrl} label={googleLabel} ariaLabel={googleAriaLabel} variant="google" icon={MapPin} />
      <NavigationButton href={appleUrl} label={appleLabel} ariaLabel={appleAriaLabel} variant="apple" icon={Navigation} />
      <NavigationButton href={mapyUrl} label={mapyLabel} ariaLabel={mapyAriaLabel} variant="mapy" icon={Map} />
    </div>
  );
}

type NavigationVariant = "google" | "apple" | "mapy";

// Barevné odlišení podle služby (ne loga — viz zadání) — každá má svou
// rozpoznatelnou identitu: Google modrá, Apple tmavě námořnická
// (sjednocená s designovými tokeny appky, ne čistě černá), Mapy.com
// zelená (Seznam Mapy).
const VARIANT_CLASS: Record<NavigationVariant, string> = {
  google: "border-2 border-[#4285F4] bg-white text-[#4285F4] hover:bg-[#4285F4]/10",
  apple: "border-2 border-navy-900 bg-navy-900 text-white hover:bg-navy-800",
  mapy: "border-2 border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
};

function NavigationButton({
  href,
  label,
  ariaLabel,
  variant,
  icon: Icon,
}: {
  href: string | null;
  label: string;
  ariaLabel: string;
  variant: NavigationVariant;
  icon: typeof MapPin;
}) {
  const baseClass =
    "flex min-h-[44px] w-full items-center justify-center gap-1 rounded-xl px-1.5 text-center text-xs font-bold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 sm:gap-1.5 sm:px-2 sm:text-sm";

  if (!href) {
    return (
      <button type="button" disabled aria-label={ariaLabel} className={`${baseClass} cursor-not-allowed border-2 border-gray-200 bg-gray-100 text-gray-400`}>
        <Icon aria-hidden="true" size={16} strokeWidth={2.25} className="shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} className={`${baseClass} ${VARIANT_CLASS[variant]}`}>
      <Icon aria-hidden="true" size={16} strokeWidth={2.25} className="shrink-0" />
      <span className="truncate">{label}</span>
    </a>
  );
}
