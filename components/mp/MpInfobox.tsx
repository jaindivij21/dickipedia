import type { ReactNode } from 'react';
import {
  ExternalLink,
  Landmark,
  MapPin,
  Vote,
  CalendarCheck,
  History,
  Briefcase,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';
import { getParty, type Mp } from '@/lib/data';
import { PartySymbol } from '@/components/PartySymbol';

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className='border-border flex items-start justify-between gap-3 border-b py-3 text-sm last:border-0'>
      <span className='text-ink-soft flex shrink-0 items-center gap-2 font-mono text-xs'>
        {icon}
        {label}
      </span>
      <span className='text-right font-medium text-balance'>{value}</span>
    </div>
  );
}

export function MpInfobox({ mp }: { mp: Mp }) {
  return (
    <aside className='mt-14 lg:sticky lg:top-20 lg:self-start'>
      <div className='border-border bg-surface rounded-lg border p-5'>
        <h2 className='eyebrow flex items-center gap-2'>
          <ClipboardList size={13} /> At a glance
        </h2>
        <div className='mt-3'>
          <InfoRow
            icon={<Landmark size={13} />}
            label='Party'
            value={
              <span className='flex items-center justify-end gap-1.5'>
                <PartySymbol
                  code={mp.party}
                  full={mp.party_full}
                  src={getParty(mp.party)?.symbol}
                  size={16}
                />
                {mp.party_full}
              </span>
            }
          />
          <InfoRow icon={<MapPin size={13} />} label='Constituency' value={mp.pc_name} />
          <InfoRow icon={<Vote size={13} />} label='Reservation' value={mp.reservation} />
          {mp.age != null && (
            <InfoRow
              icon={<CalendarCheck size={13} />}
              label='Age'
              value={`${mp.age}${mp.gender ? ` · ${mp.gender}` : ''}`}
            />
          )}
          {mp.terms != null && (
            <InfoRow icon={<History size={13} />} label='Terms' value={String(mp.terms)} />
          )}
          {mp.profession && (
            <InfoRow icon={<Briefcase size={13} />} label='Profession' value={mp.profession} />
          )}
          {mp.qualification && (
            <InfoRow
              icon={<GraduationCap size={13} />}
              label='Education'
              value={mp.qualification}
            />
          )}
        </div>
        {mp.profile_url && (
          <a
            href={mp.profile_url}
            target='_blank'
            rel='noopener noreferrer'
            className='border-border hover:bg-surface-2 focus-visible:ring-ink/40 mt-4 flex items-center justify-center gap-2 border py-2.5 font-mono text-[11px] tracking-wide uppercase transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
          >
            <ExternalLink size={13} /> Official Sansad profile
          </a>
        )}
      </div>

      <div className='border-border bg-surface-2 mt-4 rounded-lg border p-4'>
        <p className='eyebrow flex items-center gap-2'>
          <History size={13} /> Revision history
        </p>
        <p className='text-ink-soft mt-2 text-[11px] leading-relaxed'>
          1 revision · imported from public records. Every future edit will be versioned, attributed
          and sourced — Wikipedia-style.
        </p>
        <button
          type='button'
          disabled
          className='border-border text-ink-soft mt-3 w-full cursor-not-allowed border py-2 font-mono text-[10px] tracking-wide uppercase opacity-60'
        >
          View full history (coming soon)
        </button>
      </div>
    </aside>
  );
}
