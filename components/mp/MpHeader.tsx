import Link from 'next/link';
import { AlertTriangle, Gavel, MessageSquareText, Megaphone, Mic, MapPin } from 'lucide-react';
import { getParty, type Mp } from '@/lib/mp/data';
import { scoreBand } from '@/lib/format';
import { PHOTO_SRC } from '@/lib/mp/constants';
import { ScoreGauge } from '@/components/ui/ScoreGauge';
import { PartySymbol } from '@/components/ui/PartySymbol';
import { Portrait } from '@/components/ui/Portrait';
import { Badge } from '@/components/ui/Badge';
import { MpLede } from '@/components/mp/MpLede';

export function MpHeader({ mp }: { mp: Mp }) {
  const band = scoreBand(mp.accountability_score);
  const cases = mp.criminal_cases ?? 0;
  return (
    <header>
      <nav className='text-ink-soft flex items-center gap-1.5 py-4 font-mono text-[11px]'>
        <Link
          href='/mp'
          className='hover:text-accent focus-visible:ring-ink/40 rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
        >
          MPs
        </Link>
        <span>/</span>
        <span>{mp.eci_state}</span>
        <span>/</span>
        <span className='text-ink'>{mp.pc_name}</span>
      </nav>

      <p className='eyebrow'>
        Record №{mp.pc_id} · 18th Lok Sabha{mp.minister ? ' · Union Minister' : ''}
      </p>
      <h1 className='rule-top mt-0 max-w-[18ch] pt-6 text-[2.25rem] leading-[1.05] font-bold tracking-[-0.02em] text-balance sm:text-5xl'>
        {mp.mp_name}
      </h1>

      <div className='mt-8 grid items-start gap-x-8 gap-y-6 sm:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto]'>
        <div className='border-border bg-surface-2 shrink-0 rounded-lg border p-3'>
          <Portrait
            src={mp.photo_hotlink}
            name={mp.mp_name}
            imgClassName='border-ink aspect-[4/5] w-32 border object-cover object-top grayscale-[12%] sm:w-36'
            fallbackClassName='border-ink text-ink-soft grid aspect-[4/5] w-32 place-items-center border font-mono text-2xl sm:w-36'
          />
          {mp.photo_source && (
            <p className='eyebrow text-ink-soft mt-2 text-center text-[9px]'>
              Portrait · {PHOTO_SRC[mp.photo_source]}
            </p>
          )}
        </div>

        <div className='min-w-0'>
          <p className='eyebrow flex items-center gap-1.5'>
            <MapPin size={12} /> {mp.pc_name}, {mp.eci_state}
          </p>
          <p className='mt-1.5 flex items-center gap-2 font-serif text-xl font-semibold text-balance'>
            <PartySymbol
              code={mp.party}
              full={mp.party_full}
              src={getParty(mp.party)?.symbol}
              size={24}
            />
            {mp.party_full}
          </p>
          <MpLede mp={mp} />
          <div className='mt-4 flex flex-wrap gap-2'>
            {mp.nota_gt_margin && (
              <Badge token='var(--color-warning)'>
                <AlertTriangle size={11} /> NOTA &gt; victory margin
              </Badge>
            )}
            {cases > 0 && (
              <Badge token='var(--color-danger)'>
                <Gavel size={11} /> {cases} declared case{cases === 1 ? '' : 's'} · self-declared
              </Badge>
            )}
            {mp.questions === 0 && (
              <Badge>
                <MessageSquareText size={11} /> asked 0 questions
              </Badge>
            )}
            {mp.attendance_pct != null &&
              mp.prs_detail != null &&
              mp.prs_detail.debate_titles.length === 0 && (
                <Badge>
                  <Megaphone size={11} /> 0 floor interventions
                </Badge>
              )}
            {mp.press_accountability && (
              <Badge>
                <Mic size={11} /> {mp.press_accountability.flag_label}
              </Badge>
            )}
          </div>
        </div>

        <div className='border-border bg-surface-2 flex flex-col items-center gap-1 rounded-lg border px-6 py-5 sm:col-span-2 sm:self-start lg:col-span-1'>
          <ScoreGauge value={mp.accountability_score} size={140} />
          <p className='eyebrow mt-1'>accountability · {band.label}</p>
        </div>
      </div>
    </header>
  );
}
