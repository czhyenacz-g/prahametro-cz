"use client";

import { getStoryQuote } from "../lib/i18n/dictionary.ts";
import { useI18n } from "./i18n/I18nContext.ts";

/**
 * Krátký storytelling text pod hlavním finder boxem (viz zadání) —
 * nenápadný callout, ne další karta. `vulgar` přepíná JEN citát, stejný
 * mechanismus jako hlavní hláška (getMainHeading), žádná paralelní
 * logika pro 18+ — viz components/i18n/VulgarToggle.tsx.
 *
 * Obyčejné odstavce (ne heading) — stránka už má svůj jediný H1
 * (SeoContent mainHeading, viz zadání "neporuš hierarchii headingů").
 */
export default function FinderStory() {
  const { locale, vulgar, dict } = useI18n();

  return (
    <div className="mt-6 text-center">
      <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
        {dict.finder.story.intro} <span className="font-bold text-gray-900">{getStoryQuote(locale, vulgar)}</span>
      </p>
      <p className="mt-1 text-xs text-gray-500 sm:text-sm">{dict.finder.story.outro}</p>
    </div>
  );
}
