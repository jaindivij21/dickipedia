import type { SlimMp } from '@/lib/mp/data';
import { EmptyState } from '@/components/ui/EmptyState';
import { MpCard } from '@/components/mp/browse/MpCard';

export function MpBrowserGrid({
  items,
  start,
  onClear,
}: {
  items: SlimMp[];
  start: number;
  onClear: () => void;
}) {
  if (!items.length)
    return (
      <div className='mt-4'>
        <EmptyState
          message='No member matches those filters.'
          action={
            <button
              onClick={onClear}
              className='text-accent font-mono text-xs uppercase hover:underline'
            >
              Clear filters
            </button>
          }
        />
      </div>
    );
  return (
    <div className='border-border bg-border mt-4 grid grid-cols-1 gap-px border sm:grid-cols-2 xl:grid-cols-3'>
      {items.map((m, i) => (
        <MpCard key={m.slug} m={m} n={start + i + 1} />
      ))}
    </div>
  );
}
