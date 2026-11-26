import { Gift } from "lucide-react";
import { AD_LINK_REL } from "../../lib/ads/validate-url.ts";

/**
 * Přesný affiliate odkaz Dognet → Allegro (vyhledávání „LEGO Botanicals“)
 * včetně všech parametrů — neměnit, nepřeskládávat, neodstraňovat
 * kódování (`url` parametr je záměrně URL-encoded).
 */
export const GIFT_AFFILIATE_HREF =
  "https://go.dognet.com/?chid=abvHcCbs&d1=kjdmetro&d2=lego&url=https%3A%2F%2Fallegro.cz%2Fvyhledavani%3Fstring%3DLEGO%2BBotanicals";

/**
 * Statický kompaktní affiliate banner (Server Component) jen na české
 * homepage, přímo nad sekcí „Pražské metro na jednom místě“. Odkaz vede
 * na výsledky vyhledávání, proto banner záměrně neuvádí cenu ani
 * dostupnost. Barvy převzaté z reklamní karty (AdCard.tsx, ad-purple),
 * rozestupy a šířka z okolních karet homepage.
 * Desktop: text vlevo, tlačítko vpravo; mobil: tlačítko pod textem.
 */
export default function GiftAffiliateBanner() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-3">
      <aside
        aria-label="Tip na dárek"
        data-testid="gift-affiliate-banner"
        className="flex flex-col gap-3 rounded-2xl border border-ad-purple-200 bg-ad-purple-50 p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:p-5"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ad-purple-700">
            <Gift aria-hidden="true" size={20} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wide text-ad-purple-700">Tip na dárek</span>
            <p className="mt-0.5 text-base font-bold text-gray-900">LEGO Botanicals</p>
            <p className="mt-0.5 text-sm text-gray-600">Postav si květiny, které nepotřebují zalévat.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1 sm:items-end">
          <a
            href={GIFT_AFFILIATE_HREF}
            target="_blank"
            rel={AD_LINK_REL}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-ad-purple-700 px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ad-purple-700"
          >
            Prohlédnout nabídky na Allegru
          </a>
          <span className="text-xs text-gray-500">Affiliate odkaz · Z nákupu můžeme získat provizi.</span>
        </div>
      </aside>
    </div>
  );
}
