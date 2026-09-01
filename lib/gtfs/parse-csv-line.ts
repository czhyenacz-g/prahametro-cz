// Jednořádkový quote-aware CSV splitter — na rozdíl od parse-csv.ts
// NEPODPORUJE pole s newline uvnitř uvozovek (GTFS operační soubory typu
// stop_times.txt nikdy takové pole nemají — jde jen o ID/čísla/časy).
// Používá se výhradně ve stream-filter-csv.ts pro velké soubory, kde
// není žádoucí načítat celý soubor do paměti.
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      fields.push(field);
      field = "";
      continue;
    }

    field += char;
  }

  fields.push(field);
  return fields;
}
