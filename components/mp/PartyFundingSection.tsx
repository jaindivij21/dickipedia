import { Landmark } from 'lucide-react';
import { type Party, MANIFEST } from '@/lib/data';
import { rupeeCr } from '@/lib/format';
import { TOP_DONORS_SHOWN } from '@/lib/constants';
import { DataSection } from '@/components/mp/DataSection';
import { StatCell, StatGrid } from '@/components/ui/StatCell';
import { Bar } from '@/components/charts';

export function PartyFundingSection({ party }: { party: Party | undefined }) {
  if (!party || party.bond_total <= 0) return null;
  const donors = party.top_donors.slice(0, TOP_DONORS_SHOWN);
  const donorMax = donors[0]?.amount ?? 1;

  return (
    <DataSection
      icon={<Landmark size={20} />}
      kicker='Party funding'
      title='Who bankrolled the party'
      sub={`Electoral bonds received by ${party.full} between 2019 and 2024 — party-level, not attributable to this MP. The scheme was struck down by the Supreme Court in February 2024.`}
      src='bonds'
      updatedAt={MANIFEST.sources.bonds?.as_of}
    >
      <StatGrid cols={3}>
        <StatCell label='National bond rank' figure={party.rank != null ? `№${party.rank}` : '—'} />
        <StatCell label='Total received' figure={rupeeCr(party.bond_total)} />
        <StatCell label='Instruments' figure={party.bond_count.toLocaleString('en-IN')} />
      </StatGrid>

      <div className='border-border bg-surface-2 mt-4 rounded-lg border p-5'>
        <p className='eyebrow mb-3'>Top corporate donors to {party.full}</p>
        {donors.length > 0 ? (
          <div className='flex flex-col gap-2'>
            {donors.map((d) => (
              <div key={d.name} className='flex items-center gap-3'>
                <span className='text-ink-soft w-48 shrink-0 truncate font-mono text-[11px]'>
                  {d.name}
                </span>
                <Bar value={d.amount} max={donorMax} color='var(--color-ink)' />
                <span className='w-20 shrink-0 text-right font-mono text-[11px] font-bold'>
                  {rupeeCr(d.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-ink-soft text-xs leading-snug'>
            Donor-level breakdown is not disclosed for this party in the public bond data.
          </p>
        )}
      </div>
    </DataSection>
  );
}
