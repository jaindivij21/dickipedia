import { Bar } from '@/components/charts';

export function MinistryBreakdown({
  ministries,
  max,
}: {
  ministries: [string, number][];
  max: number;
}) {
  if (!ministries.length) return null;
  return (
    <div className='border-border bg-surface-2 mt-4 rounded-lg border p-5'>
      <p className='eyebrow mb-3'>What they ask about · questions by ministry</p>
      <div className='flex flex-col gap-2'>
        {ministries.map(([name, count]) => (
          <div key={name} className='flex items-center gap-3'>
            <span className='text-ink-soft w-44 shrink-0 truncate font-mono text-[11px]'>
              {name}
            </span>
            <Bar value={count} max={max} color='var(--color-ink)' />
            <span className='w-6 shrink-0 text-right font-mono text-[11px] font-bold'>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
