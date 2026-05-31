import { Vote, Users, Trophy } from 'lucide-react';
import { type Mp, MANIFEST } from '@/lib/data';
import { pct } from '@/lib/format';
import { DataSection } from '@/components/mp/DataSection';
import { StatCell, StatGrid } from '@/components/ui/StatCell';
import { Bar } from '@/components/charts';

const inIN = (n: number) => n.toLocaleString('en-IN');

function MandateRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div className='flex items-center gap-3'>
      <span className='text-ink-soft w-28 shrink-0 font-mono text-[11px]'>{label}</span>
      <Bar value={value} max={max} color={color} />
      <span className='w-24 shrink-0 text-right font-mono text-[11px] font-bold'>
        {inIN(value)}
      </span>
    </div>
  );
}

export function ElectionSection({ mp }: { mp: Mp }) {
  const mandateMax = Math.max(mp.margin_votes, mp.nota_votes, 1);
  return (
    <DataSection
      icon={<Vote size={20} />}
      kicker='The election'
      title='How they won the seat'
      sub='2024 general election result, as declared by the Election Commission of India.'
      src='eci'
      updatedAt={MANIFEST.sources.eci?.as_of}
    >
      <StatGrid>
        <StatCell
          icon={<Vote size={12} />}
          label='Vote share'
          figure={pct(mp.winner_vote_share, 1)}
        />
        <StatCell
          label='Victory margin'
          figure={inIN(mp.margin_votes)}
          token={mp.nota_gt_margin ? 'var(--color-warning)' : undefined}
        />
        <StatCell label='NOTA votes' figure={inIN(mp.nota_votes)} />
        <StatCell
          icon={<Users size={12} />}
          label='Candidates'
          figure={String(mp.num_candidates)}
        />
      </StatGrid>

      <div className='border-border bg-surface-2 mt-4 rounded-lg border p-5'>
        <p className='eyebrow mb-3'>Margin vs NOTA</p>
        <div className='flex flex-col gap-2'>
          <MandateRow
            label='Victory margin'
            value={mp.margin_votes}
            max={mandateMax}
            color='var(--color-ink)'
          />
          <MandateRow
            label='NOTA votes'
            value={mp.nota_votes}
            max={mandateMax}
            color={mp.nota_gt_margin ? 'var(--color-warning)' : 'var(--color-ink-soft)'}
          />
        </div>
        <p className='text-ink-soft mt-3 text-xs leading-snug'>
          {mp.nota_gt_margin
            ? 'More voters chose NOTA than the number of votes separating the winner from the runner-up.'
            : 'The victory margin was larger than the NOTA count in this constituency.'}
        </p>
      </div>

      <p className='text-ink-soft mt-4 flex items-center gap-1.5 text-xs'>
        <Trophy size={12} /> Runner-up:{' '}
        <span className='text-ink font-medium'>{mp.runner_up_name}</span> ({mp.runner_up_party}).
      </p>
    </DataSection>
  );
}
