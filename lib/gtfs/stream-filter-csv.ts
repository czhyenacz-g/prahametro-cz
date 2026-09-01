import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { parseCsvLine } from "./parse-csv-line.ts";

/**
 * Řádek po řádku (readline, ne fs.readFileSync) projde velký CSV soubor
 * a pro každý datový řádek zavolá `onRow` jen s vybranými sloupci —
 * `stop_times.txt` u PID GTFS má přes 100 MB a miliony řádků, naprostá
 * většina se filtruje pryč (jen metro spoje), takže by bylo zbytečné
 * (a pomalé) parsovat každý řádek na plný objekt nebo držet celý
 * soubor v paměti najednou.
 */
export async function streamCsvColumns<T extends string>(
  filePath: string,
  columns: readonly T[],
  onRow: (row: Record<T, string>) => void
): Promise<void> {
  const rl = createInterface({ input: createReadStream(filePath, { encoding: "utf-8" }), crlfDelay: Infinity });

  let header: string[] | null = null;
  let indices: number[] = [];

  for await (const line of rl) {
    if (line.length === 0) continue;

    if (!header) {
      header = parseCsvLine(line);
      indices = columns.map((col) => {
        const index = header!.indexOf(col);
        if (index === -1) {
          throw new Error(`CSV sloupec "${col}" nebyl nalezen v hlavičce ${filePath}.`);
        }
        return index;
      });
      continue;
    }

    const fields = parseCsvLine(line);
    const row = {} as Record<T, string>;
    for (let i = 0; i < columns.length; i++) {
      row[columns[i]] = fields[indices[i]] ?? "";
    }
    onRow(row);
  }
}
