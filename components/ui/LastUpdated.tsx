import { fmtDate } from '@/lib/format';
import { SRC, type SrcKey } from '@/lib/sources';

export function LastUpdated({
  date,
  source,
  label = 'Updated',
}: {
  date: string | null | undefined;
  source?: SrcKey;
  label?: string;
}) {
  if (!date) return null;
  return (
    <span className='text-ink-soft font-mono text-[11px]'>
      {label} {fmtDate(date)}
      {source ? ` · ${SRC[source].label}` : ''}
    </span>
  );
}
