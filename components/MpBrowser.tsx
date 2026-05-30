'use client';
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { MpCard } from './MpCard';
import type { SlimMp } from '@/lib/data';

export function MpBrowser({
  mps,
  parties,
  states,
}: {
  mps: SlimMp[];
  parties: string[];
  states: string[];
}) {
  const [q, setQ] = useState('');
  const [party, setParty] = useState('');
  const [state, setState] = useState('');
  const [sort, setSort] = useState<'score-asc' | 'score-desc' | 'name'>('score-asc');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = mps.filter(
      (m) =>
        (!needle || m.name.toLowerCase().includes(needle) || m.pc.toLowerCase().includes(needle)) &&
        (!party || m.party === party) &&
        (!state || m.state === state),
    );
    r = [...r].sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : sort === 'score-desc'
          ? (b.score ?? -1) - (a.score ?? -1)
          : (a.score ?? 101) - (b.score ?? 101),
    );
    return r;
  }, [mps, q, party, state, sort]);

  const sel =
    'neu-inset-sm rounded-xl bg-surface px-3 py-2.5 text-xs font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

  return (
    <section>
      <div className='neu-raised mb-5 rounded-3xl p-3 sm:p-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <div className='neu-inset flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5'>
            <Search size={16} className='text-ink-soft' />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search an MP or constituency…'
              className='placeholder:text-ink-soft w-full bg-transparent text-sm outline-none'
              aria-label='Search MPs'
            />
          </div>
          <div className='flex gap-2'>
            <select
              value={party}
              onChange={(e) => setParty(e.target.value)}
              className={sel}
              aria-label='Filter by party'
            >
              <option value=''>All parties</option>
              {parties.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={sel}
              aria-label='Filter by state'
            >
              <option value=''>All states</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className={sel}
              aria-label='Sort'
            >
              <option value='score-asc'>Worst first</option>
              <option value='score-desc'>Best first</option>
              <option value='name'>A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <p className='text-ink-soft mb-4 px-1 text-xs'>
        Showing <span className='text-ink font-bold'>{filtered.length}</span> of {mps.length} MPs
        {sort === 'score-asc' && <span> · sorted by accountability score, lowest first</span>}
      </p>

      {filtered.length === 0 ? (
        <div className='neu-inset text-ink-soft rounded-3xl p-10 text-center text-sm'>
          No MP matches that.
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {filtered.map((m) => (
            <MpCard key={m.slug} mp={m} />
          ))}
        </div>
      )}
    </section>
  );
}
