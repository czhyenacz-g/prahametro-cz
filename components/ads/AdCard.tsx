"use client";

import { useEffect } from "react";
import { AD_LINK_REL, hasValidAffiliateUrl } from "../../lib/ads/validate-url.ts";
import { emitAdEvent } from "../../lib/ads/events.ts";
import { useSelectedAd } from "../../hooks/useSelectedAd.ts";
import { useI18n } from "../i18n/I18nContext.ts";
import AdIcon from "./AdIcon.tsx";

export type AdCardProps = {
  /** Kam se karta umístila — jde do AdEvent (viz zadání "budoucí měření"). */
  placement: string;
  /** Neznámá stanice = jen obecné kampaně bez `stationIds` (viz filterCampaigns). */
  stationId?: string | null;
};

// Jedna decentní karta, žádný carousel/časovač/animace (viz zadání).
// `vulgar` z useI18n() se tu záměrně vůbec nečte — text reklamy nesmí
// jít ovlivnit režimem 18+. `mt-6` je součástí kořenové `<section>`
// (ne obalového `<div>` v FinderSection.tsx) — když komponenta vrátí
// `null` (žádná způsobilá kampaň s platným odkazem pro daný jazyk),
// nesmí po ní zůstat žádná prázdná mezera.
export default function AdCard({ placement, stationId }: AdCardProps) {
  const { locale, dict } = useI18n();
  const ad = useSelectedAd(locale, stationId);

  // `useSelectedAd`/`resolveSelectedAd` už vybírají jen mezi kampaněmi s
  // platným https: odkazem (viz lib/ads/filter-campaigns.ts) — tahle
  // podmínka je obranná pojistka, aby karta bez platného odkazu nikdy
  // nevznikla, i kdyby se výběrová logika v budoucnu změnila.
  const isEligible = ad !== null && hasValidAffiliateUrl(ad);

  useEffect(() => {
    if (!ad || !isEligible) return;
    emitAdEvent({ type: "ad_impression", campaignId: ad.id, language: locale, placement });
  }, [ad, isEligible, locale, placement]);

  if (!ad || !isEligible) return null;

  const title = ad.title[locale];
  const description = ad.description[locale];
  const cta = ad.cta[locale];
  if (!title || !description || !cta) return null;

  function handleClick() {
    if (!ad) return;
    emitAdEvent({ type: "ad_click", campaignId: ad.id, language: locale, placement });
  }

  return (
    <section aria-label={dict.ad.label} className="mt-6 rounded-2xl border border-ad-purple-200 bg-ad-purple-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AdIcon icon={ad.icon} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-ad-purple-700">{dict.ad.label}</span>
            {ad.advertiser && <span className="text-xs text-ad-purple-700/70">· {ad.advertiser}</span>}
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>

          <div className="mt-3">
            <a
              href={ad.href!}
              target="_blank"
              rel={AD_LINK_REL}
              onClick={handleClick}
              className="inline-flex min-h-[44px] items-center rounded-xl bg-ad-purple-700 px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ad-purple-700"
            >
              {cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
