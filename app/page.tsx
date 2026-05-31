import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AGGREGATES, featuredMp } from '@/lib/mp/data';
import { pct, rupeeCr, scoreBand, colorVar } from '@/lib/format';

const initials = (s: string) =>
  s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

function Finding({ label, value, token }: { label: string; value: string; token?: string }) {
  return (
    <div className='border-border flex items-baseline justify-between gap-4 border-b py-1.5 last:border-0'>
      <span className='eyebrow'>{label}</span>
      <span className='font-mono text-sm font-bold' style={{ color: token }}>
        {value}
      </span>
    </div>
  );
}

function StatCell({ figure, label, token }: { figure: string; label: string; token?: string }) {
  return (
    <div className='bg-surface flex flex-col gap-2 p-5'>
      <span className='font-mono text-4xl leading-none font-bold' style={{ color: token }}>
        {figure}
      </span>
      <span className='text-ink-soft max-w-[18ch] text-sm leading-snug'>{label}</span>
    </div>
  );
}

export default function Home() {
  const {
    criminal_pct: crimPct,
    avg_util: avgUtil,
    nota_seats: notaSeats,
    zero_questions: zeroQ,
    total,
  } = AGGREGATES;
  const featured = featuredMp();
  if (!featured) return null;
  const fBand = scoreBand(featured.score);
  const plateColor = featured.score == null ? 'var(--color-border)' : colorVar(fBand.token);

  return (
    <main className='mx-auto max-w-5xl px-4'>
      {/* Hero (kept) */}
      <section className='pt-14 pb-10 sm:pt-20 sm:pb-12'>
        <p className='eyebrow mb-4'>Volume I · 18th Lok Sabha · {total} records · 2024</p>
        <h1 className='rule-top max-w-[16ch] pt-6 text-[2.75rem] leading-[1.04] font-bold tracking-[-0.02em] text-balance sm:text-5xl lg:text-6xl'>
          The <span className='mark-accent'>public record</span> of India&rsquo;s{' '}
          <span className='text-accent font-bold'>powerful</span>, in one place.
        </h1>
        <p className='text-ink-soft mt-6 max-w-[46ch] text-lg leading-relaxed text-pretty'>
          <span className='text-ink font-medium'>
            A free, sourced encyclopedia that holds public officials to their own public record.
          </span>{' '}
          Every figure traces to a public source; the site reports facts,{' '}
          <span className='text-ink font-semibold'>never opinions</span>. The 543 MPs of the 18th
          Lok Sabha are the first chapter.
        </p>
      </section>

      {/* Featured — bordered dossier card */}
      <section className='mt-16 sm:mt-20'>
        <Link href={`/mp/${featured.slug}`} className='border-border group block border'>
          <div className='border-border relative flex items-center justify-between gap-3 border-b px-5 py-2.5'>
            <span className='eyebrow'>Featured record · lowest score on file</span>
            <span className='text-ink-soft font-mono text-[11px]'>FILE / {featured.pc_id}</span>
            <span
              aria-hidden
              className='bg-accent absolute -bottom-px left-5 h-0.5 w-8 transition-[width] group-hover:w-16 motion-reduce:transition-none'
            />
          </div>

          <div className='grid sm:grid-cols-[auto_1fr_auto]'>
            <div className='border-border bg-surface-2 border-b p-5 sm:border-r sm:border-b-0'>
              {featured.photo ? (
                <img
                  src={featured.photo}
                  alt=''
                  className='border-ink mx-auto aspect-[4/5] w-36 border object-cover object-top grayscale-[15%] transition-[filter] group-hover:grayscale-0 motion-reduce:transition-none sm:w-40'
                />
              ) : (
                <div className='border-ink text-ink-soft mx-auto grid aspect-[4/5] w-36 place-items-center border font-mono text-2xl sm:w-40'>
                  {initials(featured.name)}
                </div>
              )}
              <p className='text-ink-soft mt-2 text-center font-mono text-[10px]'>
                {featured.state}
              </p>
            </div>

            <div className='min-w-0 p-6'>
              <h2 className='group-hover:text-accent max-w-[16ch] font-serif text-2xl leading-tight font-bold tracking-[-0.01em] text-balance transition-colors sm:text-3xl'>
                {featured.name}
              </h2>
              <p className='eyebrow mt-2'>
                {featured.pc}, {featured.state} · {featured.party_full}
              </p>
              <p className='text-ink-soft mt-4 max-w-[44ch] leading-relaxed text-pretty'>
                <span className='text-ink font-medium'>{featured.name}</span> holds the lowest
                accountability score on file
                {featured.criminal != null && (
                  <>
                    {' '}
                    —{' '}
                    <span className='text-ink font-semibold'>
                      {featured.criminal} declared case
                      {featured.criminal === 1 ? '' : 's'}
                    </span>
                  </>
                )}
                {featured.attendance != null && <>, {pct(featured.attendance)} attendance</>}
                {featured.mplads_unspent != null && (
                  <>, {rupeeCr(featured.mplads_unspent)} left unspent</>
                )}
                .
              </p>
              <div className='rule-top mt-5 max-w-[44ch] pt-3'>
                {featured.criminal != null && (
                  <Finding
                    label='Criminal cases'
                    value={String(featured.criminal)}
                    token='var(--color-danger)'
                  />
                )}
                {featured.attendance != null && (
                  <Finding label='Attendance' value={pct(featured.attendance)} />
                )}
                {featured.mplads_unspent != null && (
                  <Finding label='MPLADS unspent' value={rupeeCr(featured.mplads_unspent)} />
                )}
              </div>
              <p className='text-ink-soft mt-3 text-xs italic'>
                Declared in the sworn 2024 affidavit.
              </p>
            </div>

            <div className='border-border grid place-items-center border-t p-6 sm:border-t-0 sm:border-l'>
              <div className='flex items-baseline gap-2'>
                <span
                  className='h-[9px] w-[9px] self-center rounded-full'
                  style={{ backgroundColor: plateColor }}
                />
                <span
                  className='border-b-2 pb-0.5 font-serif text-4xl leading-none font-bold'
                  style={{ color: plateColor, borderColor: plateColor }}
                >
                  {featured.score ?? '—'}
                </span>
                <span className='text-ink-soft self-baseline font-mono text-[11px]'>/100</span>
              </div>
              <p className='eyebrow mt-1.5'>score · {fBand.label}</p>
            </div>
          </div>
        </Link>
      </section>

      {/* By the numbers — 4-up stat band */}
      <section className='mt-16 sm:mt-20'>
        <h2 className='eyebrow rule-top pt-3'>By the numbers · 18th Lok Sabha</h2>
        <div className='bg-border border-border mt-5 grid grid-cols-2 gap-px border md:grid-cols-4'>
          <StatCell
            figure={`${crimPct}%`}
            label='MPs with declared criminal cases'
            token='var(--color-danger)'
          />
          <StatCell
            figure={`${avgUtil}%`}
            label='Average MPLADS funds actually spent'
            token='var(--color-warning)'
          />
          <StatCell figure={`${notaSeats}`} label='Seats where NOTA beat the victory margin' />
          <StatCell figure={`${zeroQ}`} label='MPs who asked zero questions' />
        </div>
      </section>

      {/* Categories — the volume index */}
      <section className='mt-16 sm:mt-20'>
        <h2 className='eyebrow rule-top pt-3'>Categories</h2>
        <div className='mt-5 flex flex-col gap-4'>
          <Link
            href='/mp'
            className='border-border hover:bg-surface-2 group relative flex items-center justify-between gap-6 border p-6 transition-colors'
          >
            <span
              aria-hidden
              className='bg-accent absolute top-0 left-0 h-0.5 w-10 transition-[width] group-hover:w-20 motion-reduce:transition-none'
            />
            <div>
              <span className='text-ink-soft font-mono text-sm'>VOL. I</span>
              <div className='group-hover:text-accent mt-1 font-serif text-2xl font-bold transition-colors'>
                Lok Sabha MPs
              </div>
              <div className='text-ink-soft mt-1 text-sm'>
                All {total} members of the 18th Lok Sabha (2024)
              </div>
            </div>
            <span className='text-ink-soft inline-flex shrink-0 items-center gap-2 font-mono text-sm whitespace-nowrap'>
              {total} RECORDS
              <ArrowRight
                size={14}
                className='group-hover:text-accent transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none'
              />
            </span>
          </Link>
          <div
            aria-disabled
            className='border-border flex items-center justify-between gap-6 border border-dashed p-6 opacity-60'
          >
            <div>
              <span className='text-ink-soft font-mono text-sm'>VOL. II</span>
              <div className='mt-1 font-serif text-2xl font-bold'>
                Bureaucrats, judges &amp; more
              </div>
              <div className='text-ink-soft mt-1 text-sm'>Future categories of public figures</div>
            </div>
            <span className='eyebrow shrink-0'>Planned</span>
          </div>
        </div>
        <p className='text-ink-soft mt-4 text-sm'>
          More categories of public figures will follow as the record grows.
        </p>
      </section>
    </main>
  );
}
