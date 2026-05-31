import { Wallet, Landmark, Gavel, TrendingUp, ScrollText } from 'lucide-react';
import type { Mp } from '@/lib/data';
import { rupeeCr } from '@/lib/format';
import { DataSection } from '@/components/mp/DataSection';
import { StatCell, StatGrid } from '@/components/StatCell';
import { GrowthBar, WealthTimeSeries } from '@/components/charts';

export function WealthSection({ mp }: { mp: Mp }) {
  const hasAffidavit =
    mp.total_assets != null || mp.total_liabilities != null || mp.criminal_cases != null;
  if (!hasAffidavit) return null;

  const cases = mp.criminal_cases;
  const seriousCases = mp.serious_cases;
  const otherCases = mp.non_serious_cases;
  const caseSub =
    cases && seriousCases != null && otherCases != null
      ? `${seriousCases} serious · ${otherCases} other · self-declared`
      : 'self-declared';
  const series = (mp.assets_history ?? []).filter(
    (p): p is { year: number; total_assets: number; source_url: string; label?: string } =>
      p.total_assets != null,
  );
  const trend = series.map((p) => ({ year: p.year, total: p.total_assets, label: p.label }));
  const hasTrend = trend.length >= 2;
  const overallPct = mp.assets_history_pct;
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
          sub={caseSub}
        />
        {hasTrend && overallPct != null && (
          <StatCell
            icon={<TrendingUp size={12} />}
            label={`Assets ${trend[0].year}→${trend[trend.length - 1].year}`}
            figure={`${overallPct >= 0 ? '+' : ''}${overallPct.toLocaleString('en-IN')}%`}
            token={overallPct >= 300 ? 'var(--color-warning)' : undefined}
          />
        )}
      </StatGrid>

      {hasTrend ? (
        <div className='border-border bg-surface-2 mt-4 rounded-lg border p-5'>
          <p className='eyebrow mb-3'>
            Declared assets across {trend.length} sworn affidavits ·{' '}
            {trend.map((t) => t.year).join(' → ')}
          </p>
          <WealthTimeSeries data={trend} />
          <p className='text-ink-soft mt-3 max-w-[68ch] text-xs leading-snug'>
            Each point is a sworn affidavit filed with the Election Commission. Declared assets
            moved from {rupeeCr(trend[0].total)} ({trend[0].year}) to{' '}
            {rupeeCr(trend[trend.length - 1].total)} ({trend[trend.length - 1].year})
            {overallPct != null && (
              <>
                {' '}
                — a change of{' '}
                <span className='text-ink font-medium'>
                  {overallPct >= 0 ? '+' : ''}
                  {overallPct.toLocaleString('en-IN')}%
                </span>
              </>
            )}
            .
          </p>
        </div>
      ) : (
        hasGrowth && (
          <div className='border-border bg-surface-2 mt-4 rounded-lg border p-5'>
            <p className='eyebrow mb-3'>Declared assets · 2019 vs 2024</p>
            <GrowthBar from={mp.assets_2019 as number} to={mp.assets_2024 as number} />
          </div>
        )
      )}
    </DataSection>
  );
}
