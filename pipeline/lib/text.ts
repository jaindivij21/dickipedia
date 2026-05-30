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

export function normName(s = ''): string {
  return stripDiacritics(s)
    .toUpperCase()
    .replace(HONORIFICS, ' ')
    .replace(/[.-]/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// order-insensitive token-sorted key (winner-name orderings vary across sources)
export function nameKey(s = ''): string {
  return normName(s).split(' ').filter(Boolean).sort().join(' ');
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

// RapidFuzz-style token_sort_ratio (0-100) on normalized names (fastest-levenshtein)
export function tokenSortRatio(a: string, b: string): number {
  const x = nameKey(a),
    y = nameKey(b);
  if (!x && !y) return 100;
  const d = distance(x, y);
  const max = Math.max(x.length, y.length) || 1;
  return Math.round((1 - d / max) * 100);
}
