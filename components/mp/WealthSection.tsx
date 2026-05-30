import { Wallet, Landmark, Gavel, TrendingUp, ScrollText } from 'lucide-react';
import type { Mp } from '@/lib/data';
import { rupeeCr } from '@/lib/format';
import { DataSection } from '@/components/mp/DataSection';
import { StatCell, StatGrid } from '@/components/StatCell';
import { GrowthBar } from '@/components/charts';

export function WealthSection({ mp }: { mp: Mp }) {
  const hasAffidavit =
    mp.total_assets != null || mp.total_liabilities != null || mp.criminal_cases != null;
  if (!hasAffidavit) return null;

  const cases = mp.criminal_cases;
  const hasGrowth =
    mp.assets_2019 != null && mp.assets_2024 != null && mp.wealth_pct_increase != null;

  return (
    <DataSection
      icon={<ScrollText size={20} />}
      kicker='The affidavit'
      title='What they declared'
      sub='As self-declared in the sworn 2024 election affidavit. Criminal cases are self-declared — pending ≠ convicted.'
      src='myneta'
    >
      <StatGrid cols={hasGrowth ? 4 : 3}>
        <StatCell
          icon={<Wallet size={12} />}
          label='Declared assets'
          figure={rupeeCr(mp.total_assets)}
        />
        <StatCell
          icon={<Landmark size={12} />}
          label='Liabilities'
          figure={rupeeCr(mp.total_liabilities)}
        />
        <StatCell
          icon={<Gavel size={12} />}
          label='Criminal cases'
          figure={cases == null ? '—' : String(cases)}
          token={
            cases == null ? undefined : cases > 0 ? 'var(--color-danger)' : 'var(--color-success)'
          }
          sub='self-declared'
        />
        {hasGrowth && (
          <StatCell
            icon={<TrendingUp size={12} />}
            label='Assets 2019→2024'
            figure={`+${Math.round(mp.wealth_pct_increase as number)}%`}
          />
        )}
      </StatGrid>

      {hasGrowth && (
        <div className='border-border bg-surface-2 mt-4 rounded-lg border p-5'>
          <p className='eyebrow mb-3'>Declared assets · 2019 vs 2024</p>
          <GrowthBar from={mp.assets_2019 as number} to={mp.assets_2024 as number} />
          <p className='text-ink-soft mt-3 text-xs leading-snug'>
            Declared assets grew from {rupeeCr(mp.assets_2019)} (2019 affidavit) to{' '}
            {rupeeCr(mp.assets_2024)} (2024 affidavit) — a change of{' '}
            <span className='text-ink font-medium'>
              +{Math.round(mp.wealth_pct_increase as number)}%
            </span>
            .
          </p>
        </div>
      )}
    </DataSection>
  );
}
