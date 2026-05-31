import { Gavel, ShieldCheck } from 'lucide-react';
import type { CriminalDetail } from '@/lib/data';
import { EmptyState } from '@/components/ui/EmptyState';
import { CaseRow } from '@/components/mp/affidavit/CaseRow';
import { CriminalStatBox } from '@/components/mp/affidavit/CriminalStatBox';
import { IpcSummary } from '@/components/mp/affidavit/IpcSummary';

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

  if (detail.count === 0)
    return (
      <EmptyState
        icon={<ShieldCheck size={18} className='text-success' />}
        message='No criminal cases declared in the sworn affidavit.'
      />
    );

  return (
    <div className='flex flex-col gap-5'>
      <CriminalStatBox
        total={detail.count}
        seriousCount={seriousCount}
        otherCount={detail.count - seriousCount}
        mynetaSerious={mynetaSerious}
      />
      <IpcSummary summary={ipc_summary} />
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
