"use client";

import { useEffect } from "react";
import { AD_LINK_REL, hasValidAffiliateUrl } from "../../lib/ads/validate-url.ts";
import { emitAdEvent } from "../../lib/ads/events.ts";
import { useI18n } from "../i18n/I18nContext.ts";
import type { AdCampaign } from "../../lib/ads/types.ts";
import AdIcon from "./AdIcon.tsx";

export type AdCardProps = {
  /** Už vybraná způsobilá kampaň (viz components/ads/AdSlot.tsx) — AdCard sám žádnou výběrovou logiku neřeší, jen ji vykresluje. */
  campaign: AdCampaign;
  /** Kam se karta umístila — jde do AdEvent (viz zadání "budoucí měření"). */
  placement: string;
};

// Jedna decentní karta, žádný carousel/časovač/animace (viz zadání).
// `vulgar` z useI18n() se tu záměrně vůbec nečte — text reklamy nesmí
// jít ovlivnit režimem 18+. `mt-6` je součástí kořenové `<section>`
// (ne obalového elementu ve FinderSection.tsx/AdSlot.tsx) — komponenta,
// která o zobrazení karty rozhoduje (AdSlot.tsx), po ní nesmí nechat
// žádnou prázdnou mezeru, když se místo reklamy vykreslí přání nebo nic.
export default function AdCard({ campaign, placement }: AdCardProps) {
  const { locale, dict } = useI18n();

  // AdSlot.tsx/useSelectedAd.ts už předávají jen kampaň s platným
  // https: odkazem (viz lib/ads/filter-campaigns.ts) — tahle podmínka
  // je obranná pojistka, aby karta bez platného odkazu nikdy nevznikla,
  // i kdyby se výběrová logika v budoucnu změnila.
  const isEligible = hasValidAffiliateUrl(campaign);

  useEffect(() => {
    if (!isEligible) return;
    emitAdEvent({ type: "ad_impression", campaignId: campaign.id, language: locale, placement });
  }, [campaign.id, isEligible, locale, placement]);

  if (!isEligible) return null;

  const title = campaign.title[locale];
  const description = campaign.description[locale];
  const cta = campaign.cta[locale];
  if (!title || !description || !cta) return null;

  function handleClick() {
    emitAdEvent({ type: "ad_click", campaignId: campaign.id, language: locale, placement });
  }

  return (
    <section aria-label={dict.ad.label} className="mt-6 rounded-2xl border border-ad-purple-200 bg-ad-purple-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AdIcon icon={campaign.icon} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-ad-purple-700">{dict.ad.label}</span>
            {campaign.advertiser && <span className="text-xs text-ad-purple-700/70">· {campaign.advertiser}</span>}
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>

          <div className="mt-3">
            <a
              href={campaign.href!}
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
