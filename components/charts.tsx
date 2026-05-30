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

// Declared assets across affidavit years (2014/2019/2024). Discrete sworn snapshots → straight segments
// with an ink area wash, serif ₹ figures at each vertex, mono ticks, and growth call-outs between points.
export function WealthTimeSeries({
  data,
  width = 560,
  height = 280,
}: {
  data: { year: number; total: number }[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2)
    return (
      <p className='text-ink-soft text-sm'>Only one affidavit on record — no trend to chart.</p>
    );
  const PAD = { l: 64, r: 24, t: 36, b: 28 };
  const plotW = width - PAD.l - PAD.r;
  const plotH = height - PAD.t - PAD.b;
  const maxV = Math.max(...data.map((d) => d.total)) * 1.12 || 1;
  const baseY = PAD.t + plotH;
  const x = (i: number) =>
    PAD.l + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => PAD.t + plotH - (v / maxV) * plotH;
  const pts = data.map((d, i) => ({ ...d, px: x(i), py: y(d.total) }));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => maxV * f);
  const area = `M ${pts[0].px} ${baseY} ${pts.map((p) => `L ${p.px} ${p.py}`).join(' ')} L ${pts[pts.length - 1].px} ${baseY} Z`;
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`).join(' ');
  const label = `Declared assets: ${data.map((d) => `₹${(d.total / 1e7).toFixed(2)} Cr in ${d.year}`).join(', ')}.`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width='100%'
      height='auto'
      role='img'
      aria-label={label}
      preserveAspectRatio='xMidYMid meet'
    >
      {ticks.map((t, i) => (
        <g key={i} aria-hidden>
          <line
            x1={PAD.l}
            x2={width - PAD.r}
            y1={y(t)}
            y2={y(t)}
            stroke='var(--color-border)'
            strokeWidth={1}
          />
          <text
            x={PAD.l - 8}
            y={y(t) + 3}
            textAnchor='end'
            fontFamily='var(--font-mono)'
            fontSize={10}
            fill='var(--color-ink-soft)'
          >
            {rupeeCr(t)}
          </text>
        </g>
      ))}
      <line
        x1={PAD.l}
        x2={width - PAD.r}
        y1={baseY}
        y2={baseY}
        stroke='var(--color-rule)'
        strokeWidth={2}
      />
      <path d={area} fill='var(--color-ink)' fillOpacity={0.06} />
      <path d={line} fill='none' stroke='var(--color-ink)' strokeWidth={2} strokeLinejoin='round' />
      {pts.map((p, i) => {
        const prev = pts[i - 1];
        const growth =
          prev && prev.total > 0 ? Math.round(((p.total - prev.total) / prev.total) * 100) : null;
        return (
          <g key={p.year}>
            <circle cx={p.px} cy={p.py} r={4} fill='var(--color-ink)' />
            <text
              x={p.px}
              y={p.py - 12}
              textAnchor='middle'
              fontFamily='var(--font-serif)'
              fontSize={13}
              fontWeight={700}
              fill='var(--color-ink)'
            >
              {rupeeCr(p.total)}
            </text>
            <text
              x={p.px}
              y={baseY + 18}
              textAnchor='middle'
              fontFamily='var(--font-mono)'
              fontSize={11}
              fill='var(--color-ink-soft)'
            >
              {p.year}
            </text>
            {growth != null && (
              <text
                x={(prev.px + p.px) / 2}
                y={Math.min(prev.py, p.py) - 22}
                textAnchor='middle'
                fontFamily='var(--font-mono)'
                fontSize={11}
                fontWeight={i === pts.length - 1 ? 700 : 400}
                fill='var(--color-ink-soft)'
              >
                {growth >= 0 ? '+' : ''}
                {growth.toLocaleString('en-IN')}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// A labelled horizontal bar list — reused for asset composition, income sources, questions-by-ministry.
// Labels wrap (never truncate). Values default to ink; a band token only when the row carries data meaning.
export function BarList({
  items,
  formatValue = (n) => String(n),
  labelClass = 'w-40',
}: {
  items: { label: string; value: number; valueLabel?: string; token?: string }[];
  formatValue?: (n: number) => string;
  labelClass?: string;
}) {
  if (!items.length) return <p className='text-ink-soft text-sm'>No items on record.</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className='flex flex-col gap-2'>
      {items.map((it, i) => (
        <div key={`${it.label}-${i}`} className='flex items-center gap-3'>
          <span
            className={`text-ink-soft ${labelClass} shrink-0 font-mono text-[11px] leading-tight text-balance`}
          >
            {it.label}
          </span>
          <Bar value={it.value} max={max} color={it.token ?? 'var(--color-ink)'} />
          <span
            className='w-20 shrink-0 text-right font-mono text-[11px] font-bold'
            style={it.token ? { color: it.token } : undefined}
          >
            {it.valueLabel ?? formatValue(it.value)}
          </span>
        </div>
      ))}
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
