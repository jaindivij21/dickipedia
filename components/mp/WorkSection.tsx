import { CalendarCheck, MessageSquareText, Megaphone, FileText } from 'lucide-react';
import { type Mp, AVG_ATT, AVG_Q, AVG_DEBATES, MANIFEST } from '@/lib/data';
import { pct } from '@/lib/format';
import { TOP_MINISTRIES, COHORT_HEADROOM } from '@/lib/constants';
import { DataSection } from '@/components/mp/DataSection';
import { DebateRecord } from '@/components/mp/DebateRecord';
import { CompareRow } from '@/components/mp/work/CompareRow';
import { MinistryBreakdown } from '@/components/mp/work/MinistryBreakdown';
import { StatCell, StatGrid } from '@/components/ui/StatCell';
import { EmptyState } from '@/components/ui/EmptyState';

export function WorkSection({ mp }: { mp: Mp }) {
  const hasPrs = mp.attendance_pct != null;
  const questions = mp.questions ?? 0;
  const debates = mp.debates ?? 0;
  const ministries = Object.entries(mp.questions_by_ministry ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_MINISTRIES);
  const ministryMax = ministries[0]?.[1] ?? 1;

  return (
    <DataSection
      icon={<Megaphone size={20} />}
      kicker='Parliamentary work'
      title='Did they show up — and speak?'
      sub={
        hasPrs
          ? `Lok Sabha activity tracked by PRS. House averages: ${AVG_ATT}% attendance · ${AVG_Q} questions · ${AVG_DEBATES} debates.`
          : 'Activity record from PRS Legislative Research.'
      }
      src='prs'
      updatedAt={MANIFEST.sources.prs?.as_of}
    >
      {!hasPrs ? (
        <EmptyState
          message={
            <>
              {mp.minister
                ? "As a Union Minister, this member's attendance and questions are "
                : 'This member’s parliamentary activity is '}
              <span className='text-ink font-medium'>not reported</span> by PRS Legislative
              Research.
            </>
          }
        />
      ) : (
        <>
          <div className='border-border bg-surface-2 flex flex-col gap-3 rounded-lg border p-5'>
            <CompareRow
              label='Attendance'
              value={mp.attendance_pct ?? 0}
              average={AVG_ATT}
              max={100}
              display={pct(mp.attendance_pct)}
              averageDisplay={`${AVG_ATT}%`}
            />
            <CompareRow
              label='Questions'
              value={questions}
              average={AVG_Q}
              max={Math.max(questions, AVG_Q * COHORT_HEADROOM, 1)}
              display={String(questions)}
              averageDisplay={String(AVG_Q)}
            />
            <CompareRow
              label='Debates'
              value={debates}
              average={AVG_DEBATES}
              max={Math.max(debates, AVG_DEBATES * COHORT_HEADROOM, 1)}
              display={String(debates)}
              averageDisplay={String(AVG_DEBATES)}
            />
          </div>

          <div className='mt-4'>
            <StatGrid>
              <StatCell
                icon={<CalendarCheck size={12} />}
                label='Attendance'
                figure={pct(mp.attendance_pct)}
              />
              <StatCell
                icon={<MessageSquareText size={12} />}
                label='Questions'
                figure={String(questions)}
                token={questions === 0 ? 'var(--color-danger)' : undefined}
              />
              <StatCell icon={<Megaphone size={12} />} label='Debates' figure={String(debates)} />
              <StatCell
                icon={<FileText size={12} />}
                label='Private bills'
                figure={String(mp.pmbs ?? 0)}
              />
            </StatGrid>
          </div>

          <MinistryBreakdown ministries={ministries} max={ministryMax} />
          <DebateRecord mp={mp} />
        </>
      )}
    </DataSection>
  );
}
