import type { IpcCharge } from '@/lib/data';

export function IpcSummary({ summary }: { summary: IpcCharge[] }) {
  if (!summary.length) return null;
  return (
    <div className='border-border bg-surface-2 border p-4'>
      <p className='eyebrow mb-2'>Charges by IPC / BNS section · self-declared</p>
      <ul className='flex flex-col gap-1 text-sm'>
        {summary.map((c, i) => (
          <li key={`${c.section}-${i}`} className='flex items-baseline gap-2 text-balance'>
            <span className='text-danger font-mono text-xs font-bold'>{c.count}×</span>
            <span className='text-ink-soft'>
              {c.description} <span className='font-mono text-[11px]'>(§{c.section})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
