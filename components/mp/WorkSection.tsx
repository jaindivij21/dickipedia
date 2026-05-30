import { CalendarCheck, MessageSquareText, Megaphone, FileText } from 'lucide-react';
import { type Mp, AVG_ATT, AVG_Q, AVG_DEBATES } from '@/lib/data';
import { pct } from '@/lib/format';
import { DataSection } from '@/components/mp/DataSection';
import { StatCell, StatGrid } from '@/components/StatCell';
import { Bar, CompareBar } from '@/components/charts';

const TOP_MINISTRIES = 6;
const COHORT_HEADROOM = 2;

function CompareRow({
  label,
  value,
  average,
  max,
  display,
  averageDisplay,
}: {
  label: string;
  value: number;
  average: number;
  max: number;
  display: string;
  averageDisplay: string;
}) {
  const color = value >= average ? 'var(--color-success)' : 'var(--color-warning)';
  return (
    <div className='flex items-center gap-3'>
      <span className='text-ink-soft w-24 shrink-0 font-mono text-[11px]'>{label}</span>
      <CompareBar value={value} average={average} max={max} color={color} />
      <span className='w-28 shrink-0 text-right font-mono text-[11px]'>
        <span className='text-ink font-bold'>{display}</span>
        <span className='text-ink-soft'> · house {averageDisplay}</span>
      </span>
    </div>
  );
}

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
    >
      {!hasPrs ? (
        <p className='border-border bg-surface-2 text-ink-soft rounded-lg border p-5 text-sm leading-relaxed'>
          {mp.minister
            ? "As a Union Minister, this member's attendance and questions are "
            : 'This member’s parliamentary activity is '}
          <span className='text-ink font-medium'>not reported</span> by PRS Legislative Research.
        </p>
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

          {ministries.length > 0 && (
            <div className='border-border bg-surface-2 mt-4 rounded-lg border p-5'>
              <p className='eyebrow mb-3'>What they ask about · questions by ministry</p>
              <div className='flex flex-col gap-2'>
                {ministries.map(([name, count]) => (
                  <div key={name} className='flex items-center gap-3'>
                    <span className='text-ink-soft w-44 shrink-0 truncate font-mono text-[11px]'>
                      {name}
                    </span>
                    <Bar value={count} max={ministryMax} color='var(--color-ink)' />
                    <span className='w-6 shrink-0 text-right font-mono text-[11px] font-bold'>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DataSection>
  );
}
