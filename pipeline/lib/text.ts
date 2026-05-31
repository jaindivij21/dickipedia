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

const collapseInitials = (s: string): string =>
  s.replace(/\b([A-Z0-9])(?:\s+([A-Z0-9]))+\b/g, (m) => m.replace(/\s+/g, ''));

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

function levRatio(x: string, y: string): number {
  if (!x && !y) return 100;
  const d = distance(x, y);
  return Math.round((1 - d / (Math.max(x.length, y.length) || 1)) * 100);
}

export function tokenSortRatio(a: string, b: string): number {
  return levRatio(nameKey(a), nameKey(b));
}

function initialsKey(s = ''): string {
  return normName(s)
    .split(' ')
    .filter(Boolean)
    .map((t) => t[0])
    .sort()
    .join('');
}

export function initialsRatio(a: string, b: string): number {
  return levRatio(initialsKey(a), initialsKey(b));
}

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

export function deobfuscateContact(s = ''): string {
  return String(s)
    .replace(/\s*[[(]\s*at\s*[\])]\s*/gi, '@')
    .replace(/\s*[[(]\s*dot\s*[\])]\s*/gi, '.')
    .replace(/\s+at\s+/gi, '@')
    .replace(/\s+dot\s+/gi, '.')
    .trim();
}

export function slugifyPrs(name = ''): string {
  return normName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const BANNED =
  /\b(corrupt|fraud|bribe|launder|embezzl|misappropriat|loot\b|thief|scam|crook|guilty)\w*/i;

export const hasAccusatoryPhrasing = (s: string): boolean => BANNED.test(s);

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
