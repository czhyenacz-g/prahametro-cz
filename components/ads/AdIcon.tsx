// Neutrální ikony podle kategorie kampaně (viz zadání) — jen emoji
// glyfy, stejný lehký vzorec jako ♿/📍 jinde v appce. Žádná nová
// ikonová knihovna (viz zadání "nepřidávej novou velkou knihovnu").
const CATEGORY_ICON: [prefix: string, icon: string][] = [
  ["pharmacy", "💊"],
  ["shopping", "🛍️"],
  ["luggage", "🧳"],
  ["activities", "🎫"],
  ["esim", "📶"],
  ["transfer", "🚗"],
];

const DEFAULT_ICON = "🏷️";

function iconForCampaignId(campaignId: string): string {
  const match = CATEGORY_ICON.find(([prefix]) => campaignId.startsWith(prefix));
  return match ? match[1] : DEFAULT_ICON;
}

export default function AdIcon({ campaignId }: { campaignId: string }) {
  return (
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl">
      {iconForCampaignId(campaignId)}
    </span>
  );
}
