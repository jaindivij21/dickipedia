'use client';
import { useEffect, useMemo, useState } from 'react';
import type { SlimMp } from '@/lib/data';
import { PAGE_SIZE, SORTS, type Sort, type CasesFilter, type RoleFilter } from '@/lib/constants';

export function useMpFilter(mps: SlimMp[]) {
  const [q, setQ] = useState('');
  const [party, setParty] = useState('');
  const [state, setState] = useState('');
  const [cases, setCases] = useState<CasesFilter>('all');
  const [role, setRole] = useState<RoleFilter>('all');
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

  return {
    q,
    setQ,
    party,
    setParty,
    state,
    setState,
    cases,
    setCases,
    role,
    setRole,
    sort,
    setSort,
    setPage,
    filtered,
    totalPages,
    safePage,
    start,
    pageItems,
    chips,
    clearAll,
    sortLabel,
  };
}
