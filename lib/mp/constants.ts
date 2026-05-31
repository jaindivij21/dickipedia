import type { Mp, PublicResponse, InferenceSeverity } from '@/lib/mp/data';

export type Sort = 'score-asc' | 'score-desc' | 'cases-desc' | 'assets-desc' | 'funds-asc' | 'name';
export type CasesFilter = 'all' | 'has' | 'none';
export type RoleFilter = 'all' | 'minister';

export const PAGE_SIZE = 24;

export const SORTS: { v: Sort; label: string }[] = [
  { v: 'score-asc', label: 'Worst score first' },
  { v: 'score-desc', label: 'Best score first' },
  { v: 'cases-desc', label: 'Most criminal cases' },
  { v: 'assets-desc', label: 'Highest declared assets' },
  { v: 'funds-asc', label: 'Lowest fund use' },
  { v: 'name', label: 'A–Z by name' },
];

export const TOP_MINISTRIES = 6;
export const COHORT_HEADROOM = 2;
export const TOP_DEBATE_TYPES = 8;
export const TOP_ASSETS = 8;
export const TOP_DONORS_SHOWN = 5;

export const PHOTO_SRC: Record<NonNullable<Mp['photo_source']>, string> = {
  sansad: 'Lok Sabha Secretariat',
  prs: 'PRS mptrack',
  myneta: 'MyNeta',
  inc: 'inc.in',
  bjp: 'bjp.org',
};

export const RESPONSE: Record<PublicResponse, { token?: string; label: string }> = {
  positive: { token: 'var(--color-success)', label: 'Positive' },
  negative: { token: 'var(--color-danger)', label: 'Negative' },
  divided: { token: 'var(--color-warning)', label: 'Divided' },
  neutral: { label: 'Neutral' },
};

export const SEVERITY: Record<InferenceSeverity, { token?: string; label: string }> = {
  extreme: { token: 'var(--color-danger)', label: 'Review-worthy' },
  flag: { token: 'var(--color-danger)', label: 'Flag' },
  notable: { token: 'var(--color-warning)', label: 'Notable' },
  info: { label: 'Note' },
};
