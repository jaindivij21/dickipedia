import { scoreBand, colorVar } from '@/lib/format';

export function ScoreGauge({ value, size = 132 }: { value: number | null; size?: number }) {
  const band = scoreBand(value);
  const v = Math.max(0, Math.min(100, value ?? 0));
  const r = size / 2 - 13;
  const cx = size / 2,
    cy = size / 2;
  const len = Math.PI * r;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <div className='flex flex-col items-center'>
      <svg
        width={size}
        height={cy + 18}
        viewBox={`0 0 ${size} ${cy + 18}`}
        role='img'
        aria-label={`Accountability score ${value ?? 'unknown'} of 100`}
      >
        <path
          d={arc}
          fill='none'
          stroke='var(--color-track)'
          strokeWidth={13}
          strokeLinecap='round'
        />
        {value != null && (
          <path
            d={arc}
            fill='none'
            stroke={colorVar(band.token)}
            strokeWidth={13}
            strokeLinecap='round'
            strokeDasharray={`${(v / 100) * len} ${len}`}
          />
        )}
        <text
          x={cx}
          y={cy - 10}
          textAnchor='middle'
          fontSize={34}
          fontWeight={700}
          fontFamily='var(--font-serif)'
          fill='var(--color-ink)'
        >
          {value ?? '—'}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor='middle'
          fontSize={9}
          fontFamily='var(--font-mono)'
          fill='var(--color-ink-soft)'
          letterSpacing={1}
        >
          / 100
        </text>
      </svg>
      <span
        className='bg-surface-2 -mt-1 rounded-full px-3 py-1 text-[11px] font-bold'
        style={{ color: colorVar(band.token) }}
      >
        {band.label}
      </span>
    </div>
  );
}

export function ScoreChip({ value, size = 46 }: { value: number | null; size?: number }) {
  const band = scoreBand(value);
  return (
    <span
      className='border-border bg-surface grid shrink-0 place-items-center rounded-full border font-bold'
      style={{ width: size, height: size, color: colorVar(band.token) }}
      title={`Accountability ${value ?? '?'} / 100 — ${band.label}`}
    >
      <span className='font-serif leading-none' style={{ fontSize: size * 0.36 }}>
        {value ?? '—'}
      </span>
    </span>
  );
}
