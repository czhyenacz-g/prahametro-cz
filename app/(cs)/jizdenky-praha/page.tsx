import { buildTicketsBreadcrumbJsonLd, buildTicketsMetadata } from "../../../lib/tickets/metadata.ts";
import { SITE_URL } from "../../config/site.ts";
import TicketsPage from "../../../components/tickets/TicketsPage.tsx";

export const metadata = buildTicketsMetadata("cs");

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildTicketsBreadcrumbJsonLd("cs", SITE_URL)) }} />
      <TicketsPage locale="cs" />
    </>
  );
}
