'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE } from '@/lib/constants';

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

export function MpPagination({
  safePage,
  totalPages,
  start,
  total,
  setPage,
}: {
  safePage: number;
  totalPages: number;
  start: number;
  total: number;
  setPage: (updater: number | ((p: number) => number)) => void;
}) {
  if (total <= PAGE_SIZE) return null;
  return (
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
        RECORDS {start + 1}–{Math.min(start + PAGE_SIZE, total)} OF {total}
      </p>
    </>
  );
}
