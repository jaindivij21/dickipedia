'use client';
import type { SlimMp } from '@/lib/data';
import { useMpFilter } from '@/lib/useMpFilter';
import { MpBrowserControls } from '@/components/browse/MpBrowserControls';
import { BrowserLegend } from '@/components/browse/BrowserLegend';
import { MpBrowserGrid } from '@/components/browse/MpBrowserGrid';
import { MpPagination } from '@/components/browse/MpPagination';

export function MpBrowser({
  mps,
  parties,
  states,
}: {
  mps: SlimMp[];
  parties: string[];
  states: string[];
}) {
  const f = useMpFilter(mps);
  return (
    <section>
      <MpBrowserControls
        q={f.q}
        setQ={f.setQ}
        party={f.party}
        setParty={f.setParty}
        state={f.state}
        setState={f.setState}
        cases={f.cases}
        setCases={f.setCases}
        role={f.role}
        setRole={f.setRole}
        sort={f.sort}
        setSort={f.setSort}
        parties={parties}
        states={states}
        chips={f.chips}
        clearAll={f.clearAll}
      />

      <p className='text-ink-soft mt-3 px-1 text-sm' aria-live='polite'>
        <span className='text-ink font-mono font-bold'>{f.filtered.length}</span> of {mps.length}{' '}
        records · sorted by {f.sortLabel}
      </p>

      <BrowserLegend />

      <MpBrowserGrid items={f.pageItems} start={f.start} onClear={f.clearAll} />

      <MpPagination
        safePage={f.safePage}
        totalPages={f.totalPages}
        start={f.start}
        total={f.filtered.length}
        setPage={f.setPage}
      />
    </section>
  );
}
