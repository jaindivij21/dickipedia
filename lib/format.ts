import scoreBandsJson from '@/data/config/score-bands.json';

export function rupeeCr(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e9 ? 0 : 2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function inrFull(n: number | null | undefined): string {
  return n == null ? '—' : `₹${n.toLocaleString('en-IN')}`;
}

export const pct = (n: number | null | undefined, d = 0) => (n == null ? '—' : `${n.toFixed(d)}%`);

const ORDINAL_SUFFIX = ['th', 'st', 'nd', 'rd'] as const;
export function ordinal(n: number): string {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? 'th' : (ORDINAL_SUFFIX[n % 10] ?? 'th');
  return `${n}${suffix}`;
}

export type ScoreToken = 'danger' | 'warning' | 'success';
interface ScoreBand {
  max: number;
  token: ScoreToken;
  label: string;
}
const BANDS = scoreBandsJson.bands as ScoreBand[];
const NULL_BAND = scoreBandsJson.null_band as { token: ScoreToken; label: string };

export function scoreBand(v: number | null | undefined): { token: ScoreToken; label: string } {
  if (v == null) return NULL_BAND;
  return BANDS.find((b) => v < b.max) ?? BANDS[BANDS.length - 1];
}

export const colorVar = (token: ScoreToken | 'primary') => `var(--color-${token})`;

export const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
