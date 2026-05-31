import { Bar } from '@/components/charts/Bar';

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
