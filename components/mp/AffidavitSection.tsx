import { ScrollText, Coins, FileSignature } from 'lucide-react';
import { type Mp, MANIFEST } from '@/lib/mp/data';
import { rupeeCr } from '@/lib/format';
import { TOP_ASSETS } from '@/lib/mp/constants';
import { DataSection } from '@/components/ui/DataSection';
import { CriminalCasesPanel } from '@/components/mp/affidavit/CriminalCasesPanel';
import { BarList } from '@/components/charts';

export function AffidavitSection({ mp }: { mp: Mp }) {
  const ab = mp.assets_breakdown;
  const income = mp.income;
  const contracts = mp.contracts ?? [];
  const hasDeep = mp.criminal_detail || ab || income || contracts.length > 0;
  if (!hasDeep) return null;

  const assetItems = ab
    ? [...ab.movable, ...ab.immovable]
        .filter((l) => (l.value ?? 0) > 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
        .slice(0, TOP_ASSETS)
        .map((l) => ({ label: l.category, value: l.value ?? 0, valueLabel: rupeeCr(l.value) }))
    : [];
  const itr = (income?.itr ?? [])
    .filter((r) => /self/i.test(r.person) && (r.income ?? 0) > 0)
    .map((r) => ({ label: r.fy, value: r.income ?? 0, valueLabel: rupeeCr(r.income) }));

  return (
    <DataSection
      icon={<ScrollText size={20} />}
      kicker='The affidavit · in detail'
      title='Cases, assets & income, line by line'
      sub='Reproduced from the sworn 2024 ECI affidavit. Self-declared — pending ≠ convicted.'
      src='myneta'
      updatedAt={MANIFEST.sources.myneta?.as_of}
    >
      {mp.criminal_detail && (
        <CriminalCasesPanel detail={mp.criminal_detail} mynetaSerious={mp.myneta_serious} />
      )}

      {ab && (ab.movable_total != null || ab.immovable_total != null) && (
        <div className='mt-8'>
          <p className='eyebrow mb-3 flex items-center gap-1.5'>
            <Coins size={12} /> Where the declared wealth sits
          </p>
          <div className='border-border bg-surface-2 mb-4 grid grid-cols-2 gap-px border'>
            <div className='bg-surface p-4'>
              <p className='text-ink-soft font-mono text-[11px]'>Movable</p>
              <p className='font-serif text-2xl leading-none font-bold'>
                {rupeeCr(ab.movable_total)}
              </p>
            </div>
            <div className='bg-surface p-4'>
              <p className='text-ink-soft font-mono text-[11px]'>Immovable</p>
              <p className='font-serif text-2xl leading-none font-bold'>
                {rupeeCr(ab.immovable_total)}
              </p>
            </div>
          </div>
          {assetItems.length > 0 && <BarList items={assetItems} labelClass='w-48' />}
        </div>
      )}

      {income && (income.sources.length > 0 || itr.length > 0) && (
        <div className='mt-8'>
          <p className='eyebrow mb-3 flex items-center gap-1.5'>
            <Coins size={12} /> Declared sources of income
          </p>
          {income.sources.length > 0 && (
            <ul className='border-border mb-4 border-t'>
              {income.sources.map((s, i) => (
                <li
                  key={i}
                  className='border-border flex items-baseline justify-between border-b py-2 text-sm'
                >
                  <span className='text-ink-soft font-mono text-xs'>{s.person}</span>
                  <span className='font-medium'>{s.source}</span>
                </li>
              ))}
            </ul>
          )}
          {itr.length > 0 && (
            <>
              <p className='text-ink-soft mb-2 font-mono text-[11px]'>
                Income declared in ITR, by year (self)
              </p>
              <BarList items={itr} labelClass='w-20' />
            </>
          )}
        </div>
      )}

      {contracts.length > 0 && (
        <div className='mt-8'>
          <p className='eyebrow mb-3 flex items-center gap-1.5'>
            <FileSignature size={12} /> Contracts with government / public companies
          </p>
          <ul className='border-border border-t'>
            {contracts.map((c, i) => (
              <li key={i} className='border-border border-b py-2 text-sm'>
                <span className='text-ink-soft font-mono text-xs'>{c.party}</span> — {c.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </DataSection>
  );
}
