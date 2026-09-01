"use client";

import { useI18n } from "./I18nContext.ts";

// Přepínač se dvěma stavy, aria-pressed (viz zadání). Mění POUZE hlavní
// hlášku ve FinderSection — žádné potvrzovací okno, žádná kontrola věku,
// jde jen o textový humor. Kontrastní barva + krátká animace při zapnutí,
// `motion-safe:` respektuje prefers-reduced-motion.
export default function VulgarToggle() {
  const { vulgar, dict, toggleVulgar } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleVulgar}
      aria-pressed={vulgar}
      aria-label={vulgar ? dict.header.vulgarAriaLabelOn : dict.header.vulgarAriaLabelOff}
      title={vulgar ? dict.header.vulgarAriaLabelOn : dict.header.vulgarAriaLabelOff}
      className={`flex h-11 min-w-[44px] shrink-0 items-center justify-center rounded-full border px-2 text-sm font-extrabold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
        vulgar
          ? "motion-safe:animate-[vulgar-pop_420ms_ease-out] border-red-600 bg-red-600 text-white"
          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
      }`}
    >
      18+
    </button>
  );
}
