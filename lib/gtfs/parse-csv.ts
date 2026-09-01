// Minimální RFC4180 CSV parser bez závislosti navíc — GTFS CSV soubory
// od PID mohou mít quoted pole s čárkami/uvozovkami uvnitř (např. názvy
// zastávek), takže prosté split(",") by bylo nespolehlivé. Vrací pole
// objektů podle hlavičkového řádku (`header -> value` mapa na řádek).
export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];

  const header = rows[0];
  const records: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Prázdný poslední řádek (trailing newline) přeskočit.
    if (row.length === 1 && row[0] === "") continue;

    const record: Record<string, string> = {};
    for (let col = 0; col < header.length; col++) {
      record[header[col]] = row[col] ?? "";
    }
    records.push(record);
  }

  return records;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // Normalizuj CRLF/CR na LF předem, ať se s nimi stavový automat níž
  // nemusí zvlášť zabývat.
  const input = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
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
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  // Poslední pole/řádek bez koncového newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
