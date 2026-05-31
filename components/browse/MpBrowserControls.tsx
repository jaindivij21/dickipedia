'use client';
import { Search, ChevronDown, X } from 'lucide-react';
import { SORTS, type Sort, type CasesFilter, type RoleFilter } from '@/lib/constants';

const FIELD_CLS =
  'h-11 w-full appearance-none rounded-md border border-border bg-surface pl-3 pr-8 font-mono text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink/30';

function Field({
  value,
  onChange,
  label,
  children,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLS}
        aria-label={label}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className='text-ink-soft pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2'
      />
    </div>
  );
}

export interface ControlsProps {
  q: string;
  setQ: (v: string) => void;
  party: string;
  setParty: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  cases: CasesFilter;
  setCases: (v: CasesFilter) => void;
  role: RoleFilter;
  setRole: (v: RoleFilter) => void;
  sort: Sort;
  setSort: (v: Sort) => void;
  parties: string[];
  states: string[];
  chips: { label: string; clear: () => void }[];
  clearAll: () => void;
}

export function MpBrowserControls(p: ControlsProps) {
  return (
    <>
      <div className='border-border bg-surface flex flex-col gap-3 rounded-md border p-3 sm:p-4'>
        <div className='relative'>
          <Search
            size={16}
            className='text-ink-soft pointer-events-none absolute top-1/2 left-3 -translate-y-1/2'
          />
          <input
            value={p.q}
            onChange={(e) => p.setQ(e.target.value)}
            placeholder='Search by name, constituency, or party…'
            aria-label='Search MPs'
            className='border-border bg-surface text-ink placeholder:text-ink-soft focus-visible:ring-ink/30 h-11 w-full rounded-md border pr-3 pl-10 font-mono text-sm outline-none focus-visible:ring-2'
          />
        </div>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
          <Field value={p.party} onChange={p.setParty} label='Filter by party'>
            <option value=''>All parties</option>
            {p.parties.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Field>
          <Field value={p.state} onChange={p.setState} label='Filter by state'>
            <option value=''>All states</option>
            {p.states.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Field>
          <Field
            value={p.cases}
            onChange={(v) => p.setCases(v as CasesFilter)}
            label='Filter by criminal cases'
          >
            <option value='all'>Any record</option>
            <option value='has'>Has criminal cases</option>
            <option value='none'>No criminal cases</option>
          </Field>
          <Field value={p.role} onChange={(v) => p.setRole(v as RoleFilter)} label='Filter by role'>
            <option value='all'>All members</option>
            <option value='minister'>Ministers only</option>
          </Field>
          <Field
            value={p.sort}
            onChange={(v) => p.setSort(v as Sort)}
            label='Sort order'
            className='col-span-2 sm:col-span-1'
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </Field>
        </div>
      </div>

      {p.chips.length > 0 && (
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          {p.chips.map((c) => (
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
            onClick={p.clearAll}
            className='text-accent ml-1 font-mono text-xs uppercase hover:underline'
          >
            Clear all
          </button>
        </div>
      )}
    </>
  );
}
