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
      <circle cx={c} cy={c} r={r} fill='none' stroke='var(--neu-dark)' strokeWidth={13} />
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
          fontSize={17}
          fontWeight={700}
          fill='var(--color-ink)'
        >
          {centerTop}
        </text>
      )}
      {centerBottom && (
        <text x={c} y={c + 14} textAnchor='middle' fontSize={9} fill='var(--color-ink-soft)'>
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
    <div className='neu-inset-sm w-full overflow-hidden rounded-full' style={{ height }}>
      <div
        className='h-full rounded-full'
        style={{ width: `${frac * 100}%`, background: color, minWidth: frac > 0 ? 4 : 0 }}
      />
    </div>
  );
}
