// Rupee + percent parsers shared across MyNeta scrapers (affidavit cells carry "Rs 1,23,456" forms).
const RUPEE_PREFIXED = /Rs\s*([0-9][0-9,]*)/i;
const FIRST_LONG_NUMBER = /([0-9][0-9,]{2,})/;
const SIGNED_DECIMAL = /-?\d[\d,]*\.?\d*/;

export function parseRupees(s: string): number | null {
  const text = String(s);
  const m = text.match(RUPEE_PREFIXED) ?? text.match(FIRST_LONG_NUMBER);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function parsePct(s: string): number | null {
  const m = String(s).match(SIGNED_DECIMAL);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

export function parseInt0(s: string): number {
  const m = String(s).match(/\d+/);
  return m ? Number(m[0]) : 0;
}
