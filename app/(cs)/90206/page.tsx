import type { Metadata } from "next";
import { buildBreadcrumbListJsonLd } from "../../../lib/seo/structured-data.ts";
import { SMS_90206_TEXT } from "../../../lib/sms90206/content.ts";
import { SMS_90206_PATH } from "../../../lib/sms90206/services.ts";
import { SITE_URL } from "../../config/site.ts";
import Sms90206Page from "../../../components/sms90206/Sms90206Page.tsx";

const { seo } = SMS_90206_TEXT;

// Jen česky — bez hreflang alternates (stejně jako průvodci stanicemi).
export const metadata: Metadata = {
  title: { absolute: seo.title },
  description: seo.description,
  alternates: { canonical: SMS_90206_PATH },
  openGraph: { title: seo.title, description: seo.description, type: "website", url: SMS_90206_PATH, siteName: "KdeJeMetro.cz", locale: "cs_CZ" },
  twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  robots: { index: true, follow: true },
};

export default function Page() {
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd(
    [
      { name: "KdeJeMetro.cz", path: "/" },
      { name: SMS_90206_TEXT.breadcrumb, path: SMS_90206_PATH },
    ],
    SITE_URL
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Sms90206Page />
    </>
  );
}
