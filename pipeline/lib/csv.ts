import Papa from "papaparse";

// Parse CSV into trimmed string-keyed objects (papaparse handles quotes/escapes/CRLF).
export function parseCSVObjects(text: string, delimiter = ","): Record<string, string>[] {
  const res = Papa.parse<Record<string, string>>(text, {
    delimiter,
    header: true,
    skipEmptyLines: "greedy",
  });
  return (res.data || []).map((row) => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) o[k.trim()] = (v ?? "").toString().trim();
    return o;
  });
}
