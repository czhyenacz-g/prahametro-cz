import { CarFront, Luggage, ShoppingBag, Smartphone, Tag, Ticket } from "lucide-react";
import type { AdIcon as AdIconValue } from "../../lib/ads/types.ts";

// Bezpečná explicitní mapa `AdIcon` (uzavřený union, lib/ads/types.ts) →
// lucide-react ikona (viz zadání redesignu) — kampaň nikdy neurčuje
// libovolnou komponentu, jen jednu z těchto šesti hodnot.
const ICON_BY_TYPE: Record<AdIconValue, typeof ShoppingBag> = {
  pharmacy: ShoppingBag,
  shopping: ShoppingBag,
  luggage: Luggage,
  ticket: Ticket,
  esim: Smartphone,
  transfer: CarFront,
};

export type AdIconProps = {
  icon: AdIconValue | undefined;
};

// "pharmacy" nemá v lucide-react vlastní ikonu, která by jako lékárenský
// kříž fungovala vizuálně dobře uvnitř malého kulatého pole — proto se
// skládá z ShoppingBag ikony + jednoduchého kříže ze dvou CSS obdélníků
// (viz zadání "pokud Cross nevypadá jako lékárenský kříž, poskládej ho
// z obdélníků"), žádný rastrový obrázek.
export default function AdIcon({ icon }: AdIconProps) {
  const Icon = (icon && ICON_BY_TYPE[icon]) || Tag;

  return (
    <span
      aria-hidden="true"
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-ad-purple-700"
    >
      <Icon size={22} strokeWidth={2} />
      {icon === "pharmacy" && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ad-purple-700">
          <span className="absolute h-2 w-[2px] bg-white" />
          <span className="absolute h-[2px] w-2 bg-white" />
        </span>
      )}
    </span>
  );
}
