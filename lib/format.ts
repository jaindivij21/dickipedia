// Indian-format rupee compaction + score helpers.
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

/** band a 0-100 score into a semantic token */
export function scoreBand(v: number | null | undefined): {
  token: 'danger' | 'warning' | 'success';
  label: string;
} {
  if (v == null) return { token: 'warning', label: 'Not enough data' };
  if (v < 30) return { token: 'danger', label: 'Poor' };
  if (v < 55) return { token: 'warning', label: 'Mediocre' };
  if (v < 75) return { token: 'success', label: 'Decent' };
  return { token: 'success', label: 'Strong' };
}

export const colorVar = (token: 'danger' | 'warning' | 'success' | 'primary') =>
  `var(--color-${token})`;
