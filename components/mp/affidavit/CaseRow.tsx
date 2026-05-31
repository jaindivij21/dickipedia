import { AlertTriangle } from 'lucide-react';
import type { CriminalCase } from '@/lib/mp/data';

export function CaseRow({ c }: { c: CriminalCase }) {
  return (
    <li className='border-border border-b py-3 last:border-0'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
        <span className='font-medium'>{c.fir_no || c.case_no || `Case ${c.serial ?? ''}`}</span>
        <span className='flex items-center gap-2'>
          {c.serious && (
            <span className='text-warning inline-flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase'>
              <AlertTriangle size={11} /> serious
            </span>
          )}
          {c.charges_framed && (
            <span className='text-danger inline-flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase'>
              <span className='bg-danger h-1.5 w-1.5 rounded-full' /> charges framed
            </span>
          )}
        </span>
      </div>
      {c.court && <p className='text-ink-soft mt-0.5 text-xs'>{c.court}</p>}
      {c.sections.length > 0 && (
        <div className='mt-1.5 flex flex-wrap gap-1'>
          {c.sections.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className='border-border text-ink-soft inline-block border px-1.5 py-0.5 font-mono text-[10px]'
            >
              §{s}
            </span>
          ))}
        </div>
      )}
      {c.other_acts && <p className='text-ink-soft mt-1 text-[11px] italic'>{c.other_acts}</p>}
    </li>
  );
}
