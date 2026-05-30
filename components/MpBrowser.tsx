'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { pct, rupeeCr, scoreBand, colorVar } from '@/lib/format';
import type { SlimMp } from '@/lib/data';
import { PartySymbol } from '@/components/PartySymbol';

type Sort = 'score-asc' | 'score-desc' | 'cases-desc' | 'assets-desc' | 'funds-asc' | 'name';
type Cases = 'all' | 'has' | 'none';
type Role = 'all' | 'minister';

const PAGE_SIZE = 24;

const SORTS: { v: Sort; label: string }[] = [
  { v: 'score-asc', label: 'Worst score first' },
  { v: 'score-desc', label: 'Best score first' },
  { v: 'cases-desc', label: 'Most criminal cases' },
  { v: 'assets-desc', label: 'Highest declared assets' },
  { v: 'funds-asc', label: 'Lowest fund use' },
  { v: 'name', label: 'A–Z by name' },
];

const initials = (s: string) =>
  s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

function pageWindow(cur: number, total: number): (number | string)[] {
  const keep = new Set([1, total, cur, cur - 1, cur + 1].filter((n) => n >= 1 && n <= total));
  const out: (number | string)[] = [];
  let prev = 0;
  for (let n = 1; n <= total; n++) {
    if (!keep.has(n)) continue;
    if (n - prev > 1) out.push(`gap-${n}`);
    out.push(n);
    prev = n;
  }
  return out;
}

function Dot({ token }: { token: 'success' | 'warning' | 'danger' }) {
  return (
    <span
      className='inline-block h-2 w-2 rounded-full'
      style={{ backgroundColor: colorVar(token) }}
    />
  );
}

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
  const [cases, setCases] = useState<Cases>('all');
  const [role, setRole] = useState<Role>('all');
  const [sort, setSort] = useState<Sort>('score-asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const r = mps.filter(
      (m) =>
        (!needle ||
          m.name.toLowerCase().includes(needle) ||
          m.pc.toLowerCase().includes(needle) ||
          m.party_full.toLowerCase().includes(needle)) &&
        (!party || m.party === party) &&
        (!state || m.state === state) &&
        (cases === 'all' || (cases === 'has' ? (m.criminal ?? 0) > 0 : m.criminal === 0)) &&
        (role === 'all' || !!m.minister),
    );
    return [...r].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'score-desc':
          return (b.score ?? -1) - (a.score ?? -1);
        case 'cases-desc':
          return (b.criminal ?? -1) - (a.criminal ?? -1);
        case 'assets-desc':
          return (b.assets ?? -1) - (a.assets ?? -1);
        case 'funds-asc':
          return (a.mplads_util ?? 999) - (b.mplads_util ?? 999);
        default:
          return (a.score ?? 101) - (b.score ?? 101);
      }
    });
  }, [mps, q, party, state, cases, role, sort]);

  useEffect(() => setPage(1), [q, party, state, cases, role, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const chips = [
    q && { label: `“${q.trim()}”`, clear: () => setQ('') },
    party && { label: party, clear: () => setParty('') },
    state && { label: state, clear: () => setState('') },
    cases === 'has' && { label: 'Has criminal cases', clear: () => setCases('all') },
    cases === 'none' && { label: 'No criminal cases', clear: () => setCases('all') },
    role === 'minister' && { label: 'Ministers only', clear: () => setRole('all') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setQ('');
    setParty('');
    setState('');
    setCases('all');
    setRole('all');
  };

  const sortLabel = SORTS.find((s) => s.v === sort)!.label.toLowerCase();
  const fieldCls =
    'h-11 w-full appearance-none rounded-md border border-border bg-surface pl-3 pr-8 font-mono text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink/30';

  return (
    <section>
      {/* Control bar */}
      <div className='border-border bg-surface flex flex-col gap-3 rounded-md border p-3 sm:p-4'>
        <div className='relative'>
          <Search
            size={16}
            className='text-ink-soft pointer-events-none absolute top-1/2 left-3 -translate-y-1/2'
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search by name, constituency, or party…'
            aria-label='Search MPs'
            className='border-border bg-surface text-ink placeholder:text-ink-soft focus-visible:ring-ink/30 h-11 w-full rounded-md border pr-3 pl-10 font-mono text-sm outline-none focus-visible:ring-2'
          />
        </div>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
          {[
            {
              val: party,
              set: setParty,
              label: 'Filter by party',
              all: 'All parties',
              opts: parties,
            },
            {
              val: state,
              set: setState,
              label: 'Filter by state',
              all: 'All states',
              opts: states,
            },
          ].map((f) => (
            <div key={f.label} className='relative'>
              <select
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className={fieldCls}
                aria-label={f.label}
              >
                <option value=''>{f.all}</option>
                {f.opts.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className='text-ink-soft pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2'
              />
            </div>
          ))}
          <div className='relative'>
            <select
              value={cases}
              onChange={(e) => setCases(e.target.value as Cases)}
              className={fieldCls}
              aria-label='Filter by criminal cases'
            >
              <option value='all'>Any record</option>
              <option value='has'>Has criminal cases</option>
              <option value='none'>No criminal cases</option>
            </select>
            <ChevronDown
              size={14}
              className='text-ink-soft pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2'
            />
          </div>
          <div className='relative'>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className={fieldCls}
              aria-label='Filter by role'
            >
              <option value='all'>All members</option>
              <option value='minister'>Ministers only</option>
            </select>
            <ChevronDown
              size={14}
              className='text-ink-soft pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2'
            />
          </div>
          <div className='relative col-span-2 sm:col-span-1'>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className={fieldCls}
              aria-label='Sort order'
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className='text-ink-soft pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2'
            />
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          {chips.map((c) => (
            <button
              key={c.label}
              onClick={c.clear}
              className='border-border text-ink hover:border-ink inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs'
            >
              {c.label}
              <X size={11} className='text-ink-soft' />
            </button>
          ))}
          <button
            onClick={clearAll}
            className='text-accent ml-1 font-mono text-xs uppercase hover:underline'
          >
            Clear all
          </button>
        </div>
      )}

      {/* Result count + ordering */}
      <p className='text-ink-soft mt-3 px-1 text-sm' aria-live='polite'>
        <span className='text-ink font-mono font-bold'>{filtered.length}</span> of {mps.length}{' '}
        records · sorted by {sortLabel}
      </p>

      {/* Key */}
      <div className='border-border text-ink-soft mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-b py-2.5 text-[11px]'>
        <span className='eyebrow text-ink'>Key</span>
        <span className='flex flex-wrap items-center gap-x-3 gap-y-1 font-mono'>
          <span className='flex items-center gap-1.5'>
            <Dot token='success' /> ≥60 Decent
          </span>
          <span className='flex items-center gap-1.5'>
            <Dot token='warning' /> 34–59 Mediocre
          </span>
          <span className='flex items-center gap-1.5'>
            <Dot token='danger' /> &lt;34 Poor
          </span>
          <span className='text-ink-soft normal-case'>
            — the dot + numeral + underline beside each score
          </span>
        </span>
        <span className='font-mono'>
          ATT attendance · CASES criminal cases · FUNDS MPLADS spent · ASSETS declared assets
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className='border-border bg-surface text-ink-soft mt-4 rounded-md border p-12 text-center text-sm'>
          No member matches those filters.
          <button
            onClick={clearAll}
            className='text-accent ml-2 font-mono text-xs uppercase hover:underline'
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className='border-border bg-border mt-4 grid grid-cols-1 gap-px border sm:grid-cols-2 xl:grid-cols-3'>
          {pageItems.map((m, i) => {
            const crim = m.criminal;
            const band = m.score == null ? null : scoreBand(m.score);
            const bandColor = band ? colorVar(band.token) : 'var(--color-border)';
            const numColor = band ? colorVar(band.token) : 'var(--color-ink-soft)';
            const label = (band ?? scoreBand(null)).label;
            const labelColor = band ? colorVar(band.token) : 'var(--color-warning)';
            const assetsStr =
              m.assets == null
                ? '—'
                : m.assets >= 1e7
                  ? `₹${Math.round(m.assets / 1e7).toLocaleString('en-IN')} Cr`
                  : rupeeCr(m.assets);
            const stats = [
              { label: 'ATT', value: m.minister ? 'MIN.' : pct(m.attendance) },
              { label: 'CASES', value: crim == null ? '—' : String(crim), accent: (crim ?? 0) > 0 },
              { label: 'FUNDS', value: pct(m.mplads_util) },
              { label: 'ASSETS', value: assetsStr },
            ];
            return (
              <Link
                key={m.slug}
                href={`/mp/${m.slug}`}
                className='group bg-surface focus-visible:ring-ink/40 flex flex-col transition-colors hover:bg-[#faf9f7] focus-visible:ring-2 focus-visible:outline-none'
              >
                {/* Header band — record № + score plate */}
                <div className='border-border flex items-end justify-between gap-3 border-b px-4 pt-3 pb-3'>
                  <span className='text-ink-soft font-mono text-[11px] tracking-wide'>
                    № {start + i + 1}
                  </span>
                  <span
                    className='flex items-baseline gap-1.5'
                    title={`Accountability ${m.score ?? '?'} / 100 — ${label}`}
                    aria-label={`Accountability ${m.score ?? '?'} of 100 — ${label}`}
                  >
                    <span
                      className='h-[7px] w-[7px] self-center rounded-full'
                      style={{ backgroundColor: bandColor }}
                    />
                    <span
                      className='border-b-2 pb-0.5 font-serif text-[1.35rem] leading-none font-bold'
                      style={{ color: numColor, borderColor: bandColor }}
                    >
                      {m.score ?? '—'}
                    </span>
                    <span className='text-ink-soft self-baseline font-mono text-[11px]'>/100</span>
                    <span
                      className='eyebrow ml-1 self-center text-[0.6rem]'
                      style={{ color: labelColor }}
                    >
                      {label}
                    </span>
                  </span>
                </div>

                {/* Portrait + identity (grows so the stat strip pins to the bottom and aligns across a row) */}
                <div className='flex flex-1 items-start gap-4 px-4 pt-3.5 pb-4'>
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt=''
                      className='border-ink h-16 w-14 shrink-0 border object-cover object-top grayscale-[15%] transition-[filter] group-hover:grayscale-0 motion-reduce:transition-none'
                    />
                  ) : (
                    <div className='border-ink text-ink-soft grid h-16 w-14 shrink-0 place-items-center border font-mono text-base'>
                      {initials(m.name)}
                    </div>
                  )}
                  <div className='min-w-0 flex-1'>
                    <h3 className='group-hover:text-accent line-clamp-2 font-serif text-[1.0625rem] leading-[1.15] font-bold transition-colors'>
                      {m.name}
                    </h3>
                    <p className='eyebrow mt-1 truncate'>
                      {m.pc} · {m.state}
                    </p>
                    <p className='text-ink-soft mt-1 flex items-center gap-1.5 text-[13px] leading-snug'>
                      <PartySymbol code={m.party} full={m.party_full} src={m.symbol} size={16} />
                      <span className='text-balance'>{m.party_full}</span>
                    </p>
                    {(m.minister || m.nota_gt_margin) && (
                      <div className='mt-2 flex flex-wrap gap-1.5'>
                        {m.minister && (
                          <span className='eyebrow text-ink-soft border-border inline-block rounded-sm border px-1.5 py-0.5'>
                            Minister
                          </span>
                        )}
                        {m.nota_gt_margin && (
                          <span className='eyebrow text-warning border-warning/30 inline-block rounded-sm border px-1.5 py-0.5'>
                            NOTA &gt; margin
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats strip — always the last row, so strips line up across cards */}
                <div className='border-border grid grid-cols-4 border-t'>
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className='border-border flex min-w-0 flex-col items-start gap-0.5 border-l px-2.5 py-2.5 first:border-l-0'
                    >
                      <span
                        className={`font-mono text-[13px] leading-none font-bold ${s.accent ? 'text-accent' : 'text-ink'}`}
                      >
                        {s.value}
                      </span>
                      <span className='eyebrow text-[0.58rem]'>{s.label}</span>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <>
          <nav
            aria-label='Pagination'
            className='border-border mt-8 flex items-center justify-center gap-1 border-t pt-6'
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label='Previous page'
              className='border-border hover:bg-surface-2 focus-visible:ring-ink/40 inline-flex h-11 items-center gap-1 rounded-md border px-3 font-mono text-sm focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40'
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className='hidden items-center gap-1 sm:flex'>
              {pageWindow(safePage, totalPages).map((n) =>
                typeof n === 'string' ? (
                  <span key={n} aria-hidden className='text-ink-soft px-1 select-none'>
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    aria-label={`Go to page ${n}`}
                    aria-current={n === safePage ? 'page' : undefined}
                    className={`grid h-11 min-w-11 place-items-center rounded-md border px-3 font-mono text-sm ${
                      n === safePage
                        ? 'bg-ink text-bg border-ink font-bold'
                        : 'border-border hover:bg-surface-2'
                    }`}
                  >
                    {n}
                  </button>
                ),
              )}
            </span>
            <span className='text-ink-soft px-2 font-mono text-sm sm:hidden'>
              Page {safePage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label='Next page'
              className='border-border hover:bg-surface-2 focus-visible:ring-ink/40 inline-flex h-11 items-center gap-1 rounded-md border px-3 font-mono text-sm focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40'
            >
              Next <ChevronRight size={16} />
            </button>
          </nav>
          <p className='text-ink-soft mt-3 text-center font-mono text-xs'>
            RECORDS {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} OF {filtered.length}
          </p>
        </>
      )}
    </section>
  );
}
