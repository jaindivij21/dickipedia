import { rupeeCr } from '@/lib/format';

export function Donut({
  segments,
  size = 132,
  centerTop,
  centerBottom,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - 11,
    c = size / 2,
    circ = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role='img'
      aria-label={segments.map((s) => `${s.label} ${s.value}`).join(', ')}
    >
      <circle cx={c} cy={c} r={r} fill='none' stroke='var(--color-track)' strokeWidth={13} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={r}
            fill='none'
            stroke={seg.color}
            strokeWidth={13}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-off}
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
        off += dash;
        return el;
      })}
      {centerTop && (
        <text
          x={c}
          y={c - 1}
          textAnchor='middle'
          fontSize={18}
          fontWeight={700}
          fontFamily='var(--font-serif)'
          fill='var(--color-ink)'
        >
          {centerTop}
        </text>
      )}
      {centerBottom && (
        <text
          x={c}
          y={c + 14}
          textAnchor='middle'
          fontSize={9}
          fontFamily='var(--font-mono)'
          fill='var(--color-ink-soft)'
        >
          {centerBottom}
        </text>
      )}
    </svg>
  );
}

export function Bar({
  value,
  max,
  color,
  height = 10,
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
}) {
  const frac = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div className='bg-surface-2 w-full overflow-hidden rounded-full' style={{ height }}>
      <div
        className='h-full rounded-full'
        style={{ width: `${frac * 100}%`, background: color, minWidth: frac > 0 ? 4 : 0 }}
      />
    </div>
  );
}

export function CompareBar({
  value,
  average,
  max,
  color,
  height = 10,
}: {
  value: number;
  average: number;
  max: number;
  color: string;
  height?: number;
}) {
  const frac = Math.max(0, Math.min(1, max ? value / max : 0));
  const avgFrac = Math.max(0, Math.min(1, max ? average / max : 0));
  return (
    <div className='bg-surface-2 relative w-full overflow-hidden rounded-full' style={{ height }}>
      <div
        className='h-full rounded-full'
        style={{ width: `${frac * 100}%`, background: color, minWidth: frac > 0 ? 4 : 0 }}
      />
      <span
        aria-hidden
        className='bg-ink absolute top-0 h-full w-px'
        style={{ left: `${avgFrac * 100}%` }}
      />
    </div>
  );
}

export function GrowthBar({
  from,
  to,
  color = 'var(--color-ink)',
}: {
  from: number;
  to: number;
  color?: string;
}) {
  const max = Math.max(from, to, 1);
  const rows = [
    { year: '2019', value: from },
    { year: '2024', value: to },
  ];
  return (
    <div className='flex flex-col gap-2'>
      {rows.map((row) => (
        <div key={row.year} className='flex items-center gap-3'>
          <span className='text-ink-soft w-10 shrink-0 font-mono text-[11px]'>{row.year}</span>
          <div className='bg-surface-2 h-2.5 w-full overflow-hidden rounded-full'>
            <div
              className='h-full rounded-full'
              style={{
                width: `${(row.value / max) * 100}%`,
                background: color,
                minWidth: row.value > 0 ? 4 : 0,
              }}
            />
          </div>
          <span className='w-20 shrink-0 text-right font-mono text-[11px] font-bold'>
            {rupeeCr(row.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
