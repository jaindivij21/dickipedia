import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ExternalLink,
  MapPin,
  Vote,
  CalendarCheck,
  MessageSquareText,
  Megaphone,
  FileText,
  Gavel,
  Wallet,
  Coins,
  TrendingUp,
  Landmark,
  History,
  ScrollText,
  AlertTriangle,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { ALL_MPS, getMp, allSlugs, type Mp } from '@/lib/data';
import { rupeeCr, inrFull, pct, scoreBand, colorVar } from '@/lib/format';
import { ScoreGauge } from '@/components/ScoreGauge';
import { Donut, Bar } from '@/components/charts';

export const dynamicParams = false;
export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const m = getMp((await params).slug);
  if (!m) return { title: 'Not found — dickipedia' };
  return {
    title: `${m.mp_name} — ${m.pc_name} (${m.party}) · dickipedia`,
    description: `Accountability record for ${m.mp_name}, MP for ${m.pc_name}, ${m.eci_state}. Score ${m.accountability_score ?? '?'} / 100. Public records only.`,
  };
}

// cohort context
const NONMIN = ALL_MPS.filter((m) => !m.minister && m.attendance_pct != null);
const AVG_ATT = Math.round(
  NONMIN.reduce((s, m) => s + (m.attendance_pct || 0), 0) / (NONMIN.length || 1),
);
const AVG_Q = Math.round(NONMIN.reduce((s, m) => s + (m.questions || 0), 0) / (NONMIN.length || 1));
const utilArr = ALL_MPS.map((m) => m.mplads_utilisation_pct).filter((x): x is number => x != null);
const AVG_UTIL = Math.round(utilArr.reduce((s, x) => s + x, 0) / (utilArr.length || 1));

const SRC = {
  eci: { label: 'Election Commission of India', url: 'https://results.eci.gov.in/' },
  prs: { label: 'PRS Legislative Research', url: 'https://prsindia.org/mptrack' },
  sansad: { label: 'Lok Sabha Secretariat', url: 'https://sansad.in/ls/members' },
  myneta: { label: 'ADR / MyNeta — sworn affidavit', url: 'https://myneta.info/LokSabha2024/' },
  mplads: { label: 'MPLADS eSAKSHI (MoSPI)', url: 'https://mplads.mospi.gov.in/' },
  bonds: { label: 'ECI / SBI electoral-bond disclosure', url: 'https://www.eci.gov.in/' },
} as const;
type SrcKey = keyof typeof SRC;

function SourceChip({ src, href }: { src: SrcKey; href?: string }) {
  return (
    <a
      href={href || SRC[src].url}
      target='_blank'
      rel='noopener noreferrer'
      className='neu-flat neu-press text-ink-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px]'
    >
      <ExternalLink size={10} /> {SRC[src].label}
    </a>
  );
}

function Section({
  icon,
  title,
  sub,
  src,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  src?: SrcKey;
  children: React.ReactNode;
}) {
  return (
    <section className='neu-raised rounded-3xl p-5 sm:p-6'>
      <div className='mb-4 flex items-start justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <span className='neu-inset-sm text-primary grid h-9 w-9 shrink-0 place-items-center rounded-xl'>
            {icon}
          </span>
          <div>
            <h2 className='text-base leading-tight font-bold sm:text-lg'>{title}</h2>
            {sub && <p className='text-ink-soft text-[11px]'>{sub}</p>}
          </div>
        </div>
        {src && <SourceChip src={src} />}
      </div>
      {children}
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  token,
  sub,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  token?: string;
  sub?: string;
}) {
  return (
    <div className='neu-inset rounded-2xl p-4'>
      <div className='text-ink-soft flex items-center gap-1.5 text-[11px]'>
        {icon}
        {label}
      </div>
      <div className='mt-1 text-2xl leading-none font-bold' style={{ color: token }}>
        {value}
      </div>
      {sub && <div className='text-ink-soft mt-1 text-[11px] leading-tight'>{sub}</div>}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className='flex items-center justify-between gap-3 py-2 text-xs'>
      <span className='text-ink-soft flex items-center gap-2'>
        {icon}
        {label}
      </span>
      <span className='text-right font-bold'>{value}</span>
    </div>
  );
}

const initials = (n: string) =>
  n
    .replace(/^(Shri|Smt|Dr|Adv|Prof)\.?\s+/i, '')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default async function MpPage({ params }: { params: Promise<{ slug: string }> }) {
  const m = getMp((await params).slug);
  if (!m) notFound();
  const band = scoreBand(m.accountability_score);

  const ministries = Object.entries(m.questions_by_ministry || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const ministryMax = ministries[0]?.[1] || 1;
  const spent = m.mplads_expenditure ?? 0;
  const unspent = m.mplads_unspent ?? 0;

  return (
    <main className='mx-auto max-w-6xl px-4 pb-16'>
      <nav className='text-ink-soft flex items-center gap-1.5 py-4 text-[11px]'>
        <Link href='/' className='hover:text-primary'>
          MPs
        </Link>
        <span>/</span>
        <span>{m.eci_state}</span>
        <span>/</span>
        <span className='text-ink font-bold'>{m.pc_name}</span>
      </nav>

      {/* header */}
      <header className='neu-raised mb-5 rounded-3xl p-5 sm:p-6'>
        <div className='flex flex-col items-start gap-5 sm:flex-row sm:items-center'>
          {m.photo_hotlink ? (
            <img
              src={m.photo_hotlink}
              alt={m.mp_name}
              className='neu-raised-sm h-24 w-24 shrink-0 rounded-3xl object-cover sm:h-28 sm:w-28'
            />
          ) : (
            <span className='neu-inset text-ink-soft grid h-24 w-24 shrink-0 place-items-center rounded-3xl text-2xl sm:h-28 sm:w-28'>
              {initials(m.mp_name)}
            </span>
          )}
          <div className='min-w-0 flex-1'>
            <h1 className='text-2xl leading-tight font-bold text-balance sm:text-3xl'>
              {m.mp_name}
            </h1>
            <p className='text-ink-soft mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs'>
              <span className='flex items-center gap-1'>
                <MapPin size={12} />
                {m.pc_name}
                {m.reservation !== 'GEN' && ` (${m.reservation})`}, {m.eci_state}
              </span>
              <span className='neu-inset-sm text-primary rounded-full px-2 py-0.5 font-bold'>
                {m.party_full || m.party}
              </span>
              <span>· MP, 18th Lok Sabha{m.minister ? ' · Union Minister' : ''}</span>
            </p>
            <div className='mt-3 flex flex-wrap gap-2 text-[11px]'>
              {m.nota_gt_margin && (
                <span className='neu-inset-sm text-warning flex items-center gap-1 rounded-full px-2.5 py-1 font-bold'>
                  <AlertTriangle size={11} /> NOTA &gt; victory margin
                </span>
              )}
              {(m.criminal_cases ?? 0) > 0 && (
                <span className='neu-inset-sm text-danger flex items-center gap-1 rounded-full px-2.5 py-1 font-bold'>
                  <Gavel size={11} /> {m.criminal_cases} declared case
                  {m.criminal_cases === 1 ? '' : 's'}
                </span>
              )}
              {m.questions === 0 && (
                <span className='neu-inset-sm flex items-center gap-1 rounded-full px-2.5 py-1 font-bold'>
                  <MessageSquareText size={11} /> asked 0 questions
                </span>
              )}
            </div>
          </div>
          <div className='neu-inset shrink-0 self-stretch rounded-3xl p-4'>
            <ScoreGauge value={m.accountability_score} />
            <p className='text-ink-soft mt-1 max-w-[140px] text-center text-[10px] leading-tight'>
              accountability score
            </p>
          </div>
        </div>
      </header>

      <div className='grid gap-5 lg:grid-cols-[1fr_320px]'>
        {/* main column */}
        <div className='flex flex-col gap-5'>
          <Section
            icon={<Vote size={18} />}
            title='How they got the seat'
            sub='2024 general election result'
            src='eci'
          >
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              <Metric label='Vote share' value={pct(m.winner_vote_share, 1)} />
              <Metric
                label='Victory margin'
                value={m.margin_votes.toLocaleString('en-IN')}
                token={m.nota_gt_margin ? 'var(--color-warning)' : undefined}
                sub={
                  m.nota_gt_margin ? `NOTA got ${m.nota_votes.toLocaleString('en-IN')}` : undefined
                }
              />
              <Metric label='NOTA votes' value={m.nota_votes.toLocaleString('en-IN')} />
              <Metric label='Candidates' value={String(m.num_candidates)} />
            </div>
            <p className='text-ink-soft mt-3 text-xs'>
              Runner-up: <span className='text-ink font-bold'>{m.runner_up_name}</span> (
              {m.runner_up_party}).
            </p>
          </Section>

          <Section
            icon={<Megaphone size={18} />}
            title='Did they show up — and speak?'
            sub={
              m.minister
                ? "Ministers' activity isn't reported by PRS"
                : `House averages: ${AVG_ATT}% attendance · ${AVG_Q} questions`
            }
            src='prs'
          >
            {m.minister && !m.attendance_pct ? (
              <p className='neu-inset text-ink-soft rounded-2xl p-4 text-xs'>
                As a Union Minister, this member's attendance/questions are{' '}
                <span className='text-ink font-bold'>not reported</span> by PRS Legislative
                Research.
              </p>
            ) : (
              <>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                  <Metric
                    icon={<CalendarCheck size={12} />}
                    label='Attendance'
                    value={pct(m.attendance_pct)}
                    token={
                      (m.attendance_pct ?? 0) < AVG_ATT
                        ? 'var(--color-warning)'
                        : 'var(--color-success)'
                    }
                    sub={`avg ${AVG_ATT}%`}
                  />
                  <Metric
                    icon={<MessageSquareText size={12} />}
                    label='Questions'
                    value={String(m.questions ?? '—')}
                    token={m.questions === 0 ? 'var(--color-danger)' : undefined}
                    sub={`avg ${AVG_Q}`}
                  />
                  <Metric
                    icon={<Megaphone size={12} />}
                    label='Debates'
                    value={String(m.debates ?? '—')}
                  />
                  <Metric
                    icon={<FileText size={12} />}
                    label='Private bills'
                    value={String(m.pmbs ?? '—')}
                  />
                </div>
                {ministries.length > 0 && (
                  <div className='mt-4'>
                    <p className='text-ink-soft mb-2 text-[11px] font-bold'>
                      What they actually ask about — questions by ministry
                    </p>
                    <div className='flex flex-col gap-2'>
                      {ministries.map(([name, n]) => (
                        <div key={name} className='flex items-center gap-3'>
                          <span className='text-ink-soft w-40 shrink-0 truncate text-[11px]'>
                            {name}
                          </span>
                          <Bar value={n} max={ministryMax} color='var(--color-primary)' />
                          <span className='w-6 shrink-0 text-right text-[11px] font-bold'>{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>

          <Section
            icon={<Coins size={18} />}
            title='Where your development money went'
            sub={`MPLADS local-area funds · house avg ${AVG_UTIL}% spent`}
            src='mplads'
          >
            {m.mplads_allocated == null ? (
              <p className='neu-inset text-ink-soft rounded-2xl p-4 text-xs'>data unavailable</p>
            ) : (
              <div className='flex flex-col items-center gap-5 sm:flex-row'>
                <Donut
                  size={140}
                  segments={[
                    { value: spent, color: 'var(--color-success)', label: 'spent' },
                    { value: unspent, color: 'var(--color-danger)', label: 'unspent' },
                  ]}
                  centerTop={pct(m.mplads_utilisation_pct)}
                  centerBottom='utilised'
                />
                <div className='grid flex-1 grid-cols-2 gap-3'>
                  <Metric label='Allocated' value={rupeeCr(m.mplads_allocated)} />
                  <Metric
                    label='Spent'
                    value={rupeeCr(m.mplads_expenditure)}
                    token='var(--color-success)'
                  />
                  <Metric
                    label='Lying unspent'
                    value={rupeeCr(m.mplads_unspent)}
                    token='var(--color-danger)'
                  />
                  <Metric
                    label='Works completed'
                    value={`${m.mplads_works_completed ?? '—'}${m.mplads_works_recommended ? ` / ${m.mplads_works_recommended}` : ''}`}
                  />
                </div>
              </div>
            )}
          </Section>

          <Section
            icon={<ScrollText size={18} />}
            title='What they told the Election Commission'
            sub='As self-declared in the sworn 2024 affidavit · pending ≠ convicted'
            src='myneta'
          >
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              <Metric
                icon={<Wallet size={12} />}
                label='Declared assets'
                value={rupeeCr(m.total_assets)}
              />
              <Metric
                icon={<Landmark size={12} />}
                label='Liabilities'
                value={rupeeCr(m.total_liabilities)}
              />
              <Metric
                icon={<Gavel size={12} />}
                label='Criminal cases'
                value={String(m.criminal_cases ?? '—')}
                token={(m.criminal_cases ?? 0) > 0 ? 'var(--color-danger)' : 'var(--color-success)'}
                sub='self-declared'
              />
              <Metric
                icon={<TrendingUp size={12} />}
                label='Wealth 2019→24'
                value={
                  m.wealth_pct_increase != null ? `+${Math.round(m.wealth_pct_increase)}%` : '—'
                }
                token={(m.wealth_pct_increase ?? 0) > 100 ? 'var(--color-warning)' : undefined}
                sub={m.assets_2019 != null ? `from ${rupeeCr(m.assets_2019)}` : 'first term'}
              />
            </div>
          </Section>

          {m.party_bond_total != null && (
            <Section
              icon={<Landmark size={18} />}
              title='Who bankrolls the party'
              sub={`Electoral bonds received by ${m.party} (party-level, not this MP)`}
              src='bonds'
            >
              <Metric
                label={`${m.party} electoral-bond income`}
                value={rupeeCr(m.party_bond_total)}
                token='var(--color-primary)'
                sub='2019–2024 · scheme struck down by the Supreme Court, Feb 2024'
              />
            </Section>
          )}

          <Section
            icon={<ScrollText size={18} />}
            title='Where this comes from'
            sub='Every figure on this page is a public record'
          >
            <ul className='flex flex-col gap-2 text-xs'>
              {(Object.keys(SRC) as SrcKey[]).map((k) => (
                <li key={k}>
                  <a
                    href={SRC[k].url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-ink-soft hover:text-primary flex items-center gap-2'
                  >
                    <ExternalLink size={12} /> {SRC[k].label}
                  </a>
                </li>
              ))}
            </ul>
            <p className='text-ink-soft mt-3 text-[11px]'>
              dickipedia reports facts and cites them; it makes no accusations. Criminal data is
              reproduced as self-declared in sworn affidavits. Spot an error? It's open data —
              corrections welcome on GitHub.
            </p>
          </Section>
        </div>

        {/* infobox */}
        <aside className='lg:sticky lg:top-20 lg:self-start'>
          <div className='neu-raised rounded-3xl p-5'>
            <h3 className='text-ink-soft mb-3 text-xs font-bold tracking-wider uppercase'>
              At a glance
            </h3>
            <div className='divide-y divide-[color:var(--neu-dark)]/40'>
              <InfoRow icon={<Landmark size={13} />} label='Party' value={m.party} />
              <InfoRow icon={<MapPin size={13} />} label='Constituency' value={m.pc_name} />
              <InfoRow icon={<Vote size={13} />} label='Reservation' value={m.reservation} />
              {m.age != null && (
                <InfoRow
                  icon={<CalendarCheck size={13} />}
                  label='Age'
                  value={`${m.age}${m.gender ? ` · ${m.gender[0]}` : ''}`}
                />
              )}
              {m.terms != null && (
                <InfoRow icon={<History size={13} />} label='Terms' value={String(m.terms)} />
              )}
              {m.profession && (
                <InfoRow icon={<Briefcase size={13} />} label='Profession' value={m.profession} />
              )}
              {m.qualification && (
                <InfoRow
                  icon={<GraduationCap size={13} />}
                  label='Education'
                  value={m.qualification}
                />
              )}
            </div>
            {m.profile_url && (
              <a
                href={m.profile_url}
                target='_blank'
                rel='noopener noreferrer'
                className='neu-flat neu-press mt-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold'
              >
                <ExternalLink size={13} /> Official Sansad profile
              </a>
            )}
          </div>
          <div className='neu-inset mt-4 rounded-3xl p-4'>
            <div className='text-ink-soft flex items-center gap-2 text-[11px] font-bold'>
              <History size={13} /> Revision history
            </div>
            <p className='text-ink-soft mt-1 text-[11px] leading-relaxed'>
              1 revision · imported from public records. Every future edit will be versioned,
              attributed and sourced — Wikipedia-style.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
