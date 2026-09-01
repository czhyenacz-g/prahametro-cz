export type NativeAdCardProps = {
  label?: string;
  title?: string;
  description?: string;
  href?: string;
  image?: string;
};

const DEFAULT_LABEL = "Reklama";
const DEFAULT_TITLE = "Prostor pro partnera poblíž metra";
const DEFAULT_DESCRIPTION = "Zjistit více";

// V MVP jen bezpečný vlastní placeholder — žádný externí reklamní
// skript (viz zadání). Props jsou navržené tak, aby šlo později napojit
// přímé kampaně podle nejbližší stanice bez zásahu do stránek, které
// komponentu používají.
export default function NativeAdCard({ label = DEFAULT_LABEL, title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, href, image }: NativeAdCardProps) {
  const content = (
    <div className="flex min-h-[92px] items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element -- v MVP bez next/image remotePatterns pro budoucí kampaně
        <img src={image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
        <p className="mt-0.5 truncate text-sm font-medium text-gray-700">{title}</p>
        <span className="mt-1 inline-block text-sm font-semibold text-gray-900 underline">{description}</span>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer sponsored" className="block transition hover:opacity-90">
      {content}
    </a>
  );
}
