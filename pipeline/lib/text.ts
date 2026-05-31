// Normalization + fuzzy helpers for constituency-anchored entity resolution.
import { distance } from 'fastest-levenshtein';

const HONORIFICS =
  /\b(SHRI|SHRIMATI|SMT|DR|KUMARI|KM|PROF|ADV|MR|MRS|MS|MD|HAJI|MAULANA|COL|GEN|CAPT)\b\.?/g;

export function stripDiacritics(s: string): string {
  return String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

export function normConstituency(s = ''): string {
  return stripDiacritics(s)
    .toUpperCase()
    .replace(/\((SC|ST)\)/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// looser key that drops the standalone "AND" token so "ANDAMAN AND NICOBAR ISLANDS" (PRS/MyNeta)
// matches "ANDAMAN NICOBAR ISLANDS" (ECI, where "&" is dropped). Same UT-naming gap as Dadra/Daman.
export function looseConstituency(s = ''): string {
  return normConstituency(s)
    .replace(/\bAND\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STATE_ALIASES: Record<string, string> = {
  'NCT OF DELHI': 'DELHI',
  ORISSA: 'ODISHA',
  PONDICHERRY: 'PUDUCHERRY',
  UTTARANCHAL: 'UTTARAKHAND',
};

export function normState(s = ''): string {
  const up = stripDiacritics(String(s))
    .toUpperCase()
    .replace(/[^A-Z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return STATE_ALIASES[up] || up;
}

// loosened state key: drops the standalone "AND"/"THE" tokens so MPLADS' verbose UT names
// ("The Dadra And Nagar Haveli And Daman And Diu") collapse onto the ECI form. Mirror of
// looseConstituency for the per-state MPLADS bucket.
export function looseState(s = ''): string {
  return normState(s)
    .replace(/\b(AND|THE)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normName(s = ''): string {
  return stripDiacritics(s)
    .replace(/\([^)]*\)/g, ' ')
    .toUpperCase()
    .replace(HONORIFICS, ' ')
    .replace(/[.-]/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// collapse runs of single-letter initials so spaced forms match joined ones ("S P" -> "SP")
const collapseInitials = (s: string): string =>
  s.replace(/\b([A-Z0-9])(?:\s+([A-Z0-9]))+\b/g, (m) => m.replace(/\s+/g, ''));

// order-insensitive token-sorted key (winner-name orderings vary across sources)
export function nameKey(s = ''): string {
  return collapseInitials(normName(s)).split(' ').filter(Boolean).sort().join(' ');
}

const PARTY_ALIASES: Record<string, string> = {
  'BHARATIYA JANATA PARTY': 'BJP',
  'INDIAN NATIONAL CONGRESS': 'INC',
  'DRAVIDA MUNNETRA KAZHAGAM': 'DMK',
  'ALL INDIA TRINAMOOL CONGRESS': 'AITC',
  'SAMAJWADI PARTY': 'SP',
  'TELUGU DESAM': 'TDP',
  'TELUGU DESAM PARTY': 'TDP',
  'YUVAJANA SRAMIKA RYTHU CONGRESS PARTY': 'YSRCP',
  'JANATA DAL  (UNITED)': 'JD(U)',
  'JANATA DAL (UNITED)': 'JD(U)',
  'NATIONALIST CONGRESS PARTY  SHARADCHANDRA PAWAR': 'NCP(SP)',
  'SHIV SENA': 'SHS',
  'SHIV SENA (UDDHAV BALASAHEB THACKERAY)': 'SHS(UBT)',
  'COMMUNIST PARTY OF INDIA  (MARXIST)': 'CPI(M)',
  'AAM AADMI PARTY': 'AAP',
  INDEPENDENT: 'IND',
};

export function normParty(s = ''): { full: string; short: string } {
  const up = stripDiacritics(s).toUpperCase().replace(/\s+/g, ' ').trim();
  return { full: up, short: PARTY_ALIASES[up] || up };
}

// normalized levenshtein ratio (0-100) on two already-keyed strings
function levRatio(x: string, y: string): number {
  if (!x && !y) return 100;
  const d = distance(x, y);
  return Math.round((1 - d / (Math.max(x.length, y.length) || 1)) * 100);
}

// RapidFuzz-style token_sort_ratio (0-100) on normalized names (fastest-levenshtein)
export function tokenSortRatio(a: string, b: string): number {
  return levRatio(nameKey(a), nameKey(b));
}

// first-letter-of-each-token key, sorted ("Chandrakant Raghunath Patil" -> "CPR")
function initialsKey(s = ''): string {
  return normName(s)
    .split(' ')
    .filter(Boolean)
    .map((t) => t[0])
    .sort()
    .join('');
}

// ratio over sorted token-initials. Recovers abbreviated registry names ("C R Patil" ~ "Chandrakant
// Raghunath Patil") while staying low for distinct names (AK vs KS); deliberately permissive, so it is
// only used as a gap-gated tie-breaker, never as a primary match metric.
export function initialsRatio(a: string, b: string): number {
  return levRatio(initialsKey(a), initialsKey(b));
}

// RapidFuzz-style token_set_ratio (0-100). The shorter "intersection" string is compared against
// each side's "intersection + remainder", so dropped/added middle names, extra initials and suffix
// tokens score high while genuinely different surnames (e.g. RANJAN vs VERMA) stay low.
export function tokenSetRatio(a: string, b: string): number {
  const ta = new Set(nameKey(a).split(' ').filter(Boolean));
  const tb = new Set(nameKey(b).split(' ').filter(Boolean));
  if (!ta.size && !tb.size) return 100;
  const inter = [...ta].filter((t) => tb.has(t)).sort();
  const onlyA = [...ta].filter((t) => !tb.has(t)).sort();
  const onlyB = [...tb].filter((t) => !ta.has(t)).sort();
  const interStr = inter.join(' ');
  const left = [interStr, ...onlyA].join(' ').trim();
  const right = [interStr, ...onlyB].join(' ').trim();
  return Math.max(levRatio(interStr, left), levRatio(interStr, right), levRatio(left, right));
}

// Sansad publishes contact as "x[at]gmail[dot]com" / "x (at) gmail (dot) com" to defeat scrapers.
export function deobfuscateContact(s = ''): string {
  return String(s)
    .replace(/\s*[[(]\s*at\s*[\])]\s*/gi, '@')
    .replace(/\s*[[(]\s*dot\s*[\])]\s*/gi, '.')
    .replace(/\s+at\s+/gi, '@')
    .replace(/\s+dot\s+/gi, '.')
    .trim();
}

// Propose a PRS mptrack slug (lower-cased, hyphenated, honorifics dropped). The 13_prs_mptrack
// listing scrape is authoritative; this is only the fallback guess.
export function slugifyPrs(name = ''): string {
  return normName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// person-characterisations that must never be authored by the platform (CLAUDE.md invariant 3): the
// guard rejects accusatory phrasing in computed inferences and flags third-party headlines that carry
// it. "criminal case(s)" — the affidavit's own term — is intentionally NOT matched (no stem collision).
export const BANNED =
  /\b(corrupt|fraud|bribe|launder|embezzl|misappropriat|loot\b|thief|scam|crook|guilty)\w*/i;

export const hasAccusatoryPhrasing = (s: string): boolean => BANNED.test(s);

// Ranked English-Wikipedia title guesses for an MP, honorific-stripped, with disambiguators.
export function wikiTitleCandidates(name = ''): string[] {
  const cleaned = normName(name);
  if (!cleaned) return [];
  const titleCased = cleaned
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
  return [titleCased, `${titleCased} (politician)`, `${titleCased} (Indian politician)`];
}
