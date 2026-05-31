import { Gavel, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { CriminalCase, CriminalDetail } from '@/lib/data';

function CaseRow({ c }: { c: CriminalCase }) {
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

export function CriminalCasesPanel({
  detail,
  mynetaSerious,
}: {
  detail: CriminalDetail;
  mynetaSerious: boolean | null;
}) {
  const { pending, convicted, ipc_summary } = detail;
  const framedCount = pending.filter((c) => c.charges_framed).length;
  const pendingSorted = [...pending].sort(
    (a, b) =>
      Number(b.serious) - Number(a.serious) || Number(b.charges_framed) - Number(a.charges_framed),
  );
  const seriousCount = [...pending, ...convicted].filter((c) => c.serious).length;
  const otherCount = detail.count - seriousCount;
  if (detail.count === 0)
    return (
      <div className='border-border text-ink-soft flex items-center gap-2 border p-4 text-sm'>
        <ShieldCheck size={16} className='text-success' /> No criminal cases declared in the sworn
        affidavit.
      </div>
    );

  return (
    <div className='flex flex-col gap-5'>
      <div className='border-border bg-surface-2 border'>
        <div className='divide-border grid grid-cols-2 divide-x'>
          <div className='p-4'>
            <p className='text-ink-soft font-mono text-[11px]'>Cite a serious IPC section</p>
            <p className='text-warning font-serif text-2xl leading-none font-bold'>
              {seriousCount}
              <span className='text-ink-soft text-sm font-normal'> of {detail.count}</span>
            </p>
          </div>
          <div className='p-4'>
            <p className='text-ink-soft font-mono text-[11px]'>Other declared cases</p>
            <p className='font-serif text-2xl leading-none font-bold'>{otherCount}</p>
          </div>
        </div>
        <p className='border-border text-ink-soft border-t px-4 py-2 text-[11px] leading-snug'>
          &ldquo;Serious&rdquo; follows the ADR / MyNeta criteria (offence punishable by 5+ years,
          non-bailable, electoral, against the State, or a crime against women); derived from the
          self-declared sections.
          {mynetaSerious != null && (
            <>
              {' '}
              MyNeta&rsquo;s own analysis{' '}
              <span className='text-ink font-medium'>
                {mynetaSerious ? 'lists' : 'does not list'}
              </span>{' '}
              this MP among winners with declared serious criminal cases.
            </>
          )}
        </p>
      </div>

      {ipc_summary.length > 0 && (
        <div className='border-border bg-surface-2 border p-4'>
          <p className='eyebrow mb-2'>Charges by IPC / BNS section · self-declared</p>
          <ul className='flex flex-col gap-1 text-sm'>
            {ipc_summary.map((c, i) => (
              <li key={`${c.section}-${i}`} className='flex items-baseline gap-2 text-balance'>
                <span className='text-danger font-mono text-xs font-bold'>{c.count}×</span>
                <span className='text-ink-soft'>
                  {c.description} <span className='font-mono text-[11px]'>(§{c.section})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className='grid gap-5 sm:grid-cols-2'>
        <div>
          <p className='eyebrow text-danger mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5'>
            <Gavel size={12} /> Pending · {pending.length}
            {framedCount > 0 && (
              <span className='text-ink-soft normal-case'>· {framedCount} with charges framed</span>
            )}
          </p>
          {pending.length ? (
            <ul>
              {pendingSorted.map((c, i) => (
                <CaseRow key={i} c={c} />
              ))}
            </ul>
          ) : (
            <p className='text-ink-soft py-3 text-sm'>None declared.</p>
          )}
        </div>
        <div>
          <p className='eyebrow mb-1 flex items-center gap-1.5'>
            <Gavel size={12} /> Convicted · {convicted.length}
          </p>
          {convicted.length ? (
            <ul>
              {convicted.map((c, i) => (
                <CaseRow key={i} c={c} />
              ))}
            </ul>
          ) : (
            <p className='text-ink-soft py-3 text-sm'>None declared.</p>
          )}
        </div>
      </div>
      <p className='text-ink-soft text-xs italic'>
        Reproduced verbatim from the candidate&rsquo;s sworn ECI affidavit. Self-declared; pending ≠
        convicted. Cases marked &ldquo;charges framed&rdquo; are pending cases where the court has
        framed charges and the trial has begun — a court stage, not a verdict.
      </p>
    </div>
  );
}
