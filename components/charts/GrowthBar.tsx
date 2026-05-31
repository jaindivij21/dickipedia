import { rupeeCr } from '@/lib/format';

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
