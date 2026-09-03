import { recordsPath, ucaJsonRequest } from "./client.ts";
import type { UcaPaginatedResponse, UcaRecord, UcaRecordStatus } from "./types.ts";

// Obecný helper nad libovolnou UCA collection (jen čtení — token má
// pouze scope `records:read`, viz zadání "žádný privileged klíč").
// Žádný projekt-specifický název pole/kolekce tady není zadrátovaný.
// Server-only (viz komentář v ./client.ts) — nikdy neimportuj z "use client".

export type GetRecordsOptions = {
  status?: UcaRecordStatus;
  /** Max 3 filtry, klíč jen [a-zA-Z0-9_], hodnota vždy exact-match — viz UCA docs/API.md. */
  filter?: Record<string, string>;
  perPage?: number;
  revalidateSeconds?: number;
};

export async function getRecords(collection: string, options: GetRecordsOptions = {}): Promise<UcaRecord[]> {
  const query = new URLSearchParams();
  if (options.status) query.set("status", options.status);
  if (options.perPage) query.set("per_page", String(options.perPage));
  if (options.filter) {
    for (const [key, value] of Object.entries(options.filter)) {
      query.set(`filter[${key}]`, value);
    }
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await ucaJsonRequest<UcaPaginatedResponse<UcaRecord>>(recordsPath(collection, suffix), {
    method: "GET",
    revalidateSeconds: options.revalidateSeconds,
  });
  return response.data;
}
