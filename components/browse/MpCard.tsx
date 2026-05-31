import Link from 'next/link';
import type { SlimMp } from '@/lib/data';
import { pct, rupeeCr, scoreBand, colorVar } from '@/lib/format';
import { PartySymbol } from '@/components/ui/PartySymbol';
import { Portrait } from '@/components/ui/Portrait';

export function MpCard({ m, n }: { m: SlimMp; n: number }) {
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
      href={`/mp/${m.slug}`}
      className='group bg-surface focus-visible:ring-ink/40 flex flex-col transition-colors hover:bg-[#faf9f7] focus-visible:ring-2 focus-visible:outline-none'
    >
      <div className='border-border flex items-end justify-between gap-3 border-b px-4 pt-3 pb-3'>
        <span className='text-ink-soft font-mono text-[11px] tracking-wide'>№ {n}</span>
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
          <span className='eyebrow ml-1 self-center text-[0.6rem]' style={{ color: labelColor }}>
            {label}
          </span>
        </span>
      </div>

      <div className='flex flex-1 items-start gap-4 px-4 pt-3.5 pb-4'>
        <Portrait
          src={m.photo}
          name={m.name}
          imgClassName='border-ink h-16 w-14 shrink-0 border object-cover object-top grayscale-[15%] transition-[filter] group-hover:grayscale-0 motion-reduce:transition-none'
          fallbackClassName='border-ink text-ink-soft grid h-16 w-14 shrink-0 place-items-center border font-mono text-base'
        />
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
}
