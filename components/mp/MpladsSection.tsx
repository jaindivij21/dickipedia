import { Coins } from 'lucide-react';
import type { Mp } from '@/lib/data';
import { AVG_UTIL } from '@/lib/data';
import { rupeeCr, pct } from '@/lib/format';
import { DataSection } from '@/components/mp/DataSection';
import { StatCell, StatGrid } from '@/components/StatCell';
import { Donut } from '@/components/charts';

export function MpladsSection({ mp }: { mp: Mp }) {
  if (mp.mplads_allocated == null) return null;
  const spent = mp.mplads_expenditure ?? 0;
  const unspent = mp.mplads_unspent ?? 0;
  const works =
    mp.mplads_works_completed == null
      ? '—'
      : `${mp.mplads_works_completed}${
          mp.mplads_works_recommended != null ? ` / ${mp.mplads_works_recommended}` : ''
        }`;

  return (
    <DataSection
      icon={<Coins size={20} />}
      kicker='Local-area funds'
      title='Where the development money went'
      sub={`MPLADS development funds for the constituency. House average: ${AVG_UTIL}% spent.`}
      src='mplads'
    >
      <div className='flex flex-col items-stretch gap-4 sm:flex-row sm:items-center'>
        <div className='border-border bg-surface-2 grid shrink-0 place-items-center rounded-lg border p-5'>
          <Donut
            size={148}
            segments={[
              { value: spent, color: 'var(--color-success)', label: 'spent' },
              {
                value: unspent,
                color: 'color-mix(in srgb, var(--color-danger) 72%, #ffffff)',
                label: 'unspent',
              },
            ]}
            centerTop={pct(mp.mplads_utilisation_pct)}
            centerBottom='utilised'
          />
        </div>
        <div className='w-full flex-1'>
          <StatGrid>
            <StatCell label='Allocated' figure={rupeeCr(mp.mplads_allocated)} />
            <StatCell
              label='Spent'
              figure={rupeeCr(mp.mplads_expenditure)}
              token='var(--color-success)'
            />
            <StatCell
              label='Lying unspent'
              figure={rupeeCr(mp.mplads_unspent)}
              token='var(--color-danger)'
            />
            <StatCell label='Works completed' figure={works} />
          </StatGrid>
        </div>
      </div>
    </DataSection>
  );
}
