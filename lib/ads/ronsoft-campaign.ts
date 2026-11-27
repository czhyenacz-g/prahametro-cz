/**
 * Dočasná affiliate kampaň Ronsoft Black Friday 2026 (Dognet, d2=site1).
 *
 * Vypnutí: env `NEXT_PUBLIC_RONSOFT_BF_ENABLED=false` + redeploy, nebo
 * `enabled: false` níže. Po `endsAt` (konec akce dle ronsoft.cz/black-friday:
 * „Do 29. listopadu“) se banner skryje sám — na serveru při renderu i v
 * prohlížeči u staticky vygenerovaných stránek.
 * Pokud Ronsoft změní cenu 279,00 Kč nebo produkt zmizí, kampaň vypni.
 */
export const RONSOFT_BF_CAMPAIGN = {
  enabled: process.env.NEXT_PUBLIC_RONSOFT_BF_ENABLED !== "false",
  endsAt: "2026-11-29T23:59:59+01:00",
  href: "https://go.dognet.com/?chid=rpK69Esc&d1=blackwindows&d2=site1&url=https%3A%2F%2Fronsoft.cz%2Fproduct-category%2Fmicrosoft-licences%2Fwindows-licences%2F",
  imageUrl: "/ads/ronsoft-black-friday.webp",
  imageAlt: "Reklama Black Friday: Windows 11 Pro za 279,00 Kč u Ronsoftu. Zobrazit nabídku.",
  width: 2172,
  height: 724,
  textLink: "Windows 11 Pro za 279,00 Kč – Zobrazit nabídku",
  disclosure: "Reklama · Pokud nakoupíte přes tento odkaz, můžeme získat provizi.",
} as const;

export function isRonsoftCampaignActive(now: Date = new Date()): boolean {
  return RONSOFT_BF_CAMPAIGN.enabled && now.getTime() <= Date.parse(RONSOFT_BF_CAMPAIGN.endsAt);
}
