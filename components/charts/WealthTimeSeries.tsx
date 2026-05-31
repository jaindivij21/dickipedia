import { rupeeCr } from '@/lib/format';

export function WealthTimeSeries({
  data,
  width = 560,
  height = 296,
}: {
  data: { year: number; total: number; label?: string }[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2)
    return (
      <p className='text-ink-soft text-sm'>Only one affidavit on record — no trend to chart.</p>
    );
  const PAD = { l: 64, r: 24, t: 36, b: 44 };
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
        const body =
          p.label && !/lok\s*sabha|loksabha/i.test(p.label)
            ? p.label.replace(/\s*\d{4}.*$/, '').trim()
            : null;
        const anchor = i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle';
        return (
          <g key={p.year}>
            <circle cx={p.px} cy={p.py} r={4} fill='var(--color-ink)' />
            <text
              x={p.px}
              y={p.py - 12}
              textAnchor={anchor}
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
              textAnchor={anchor}
              fontFamily='var(--font-mono)'
              fontSize={11}
              fill='var(--color-ink-soft)'
            >
              {p.year}
            </text>
            {body && (
              <text
                x={p.px}
                y={baseY + 31}
                textAnchor={anchor}
                fontFamily='var(--font-mono)'
                fontSize={9}
                fill='var(--color-ink-soft)'
              >
                {body}
              </text>
            )}
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
