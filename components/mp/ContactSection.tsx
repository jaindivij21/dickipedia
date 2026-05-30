import { Mail, Phone, MapPin, Link2, Users } from 'lucide-react';
import type { Mp } from '@/lib/data';
import { DataSection } from '@/components/mp/DataSection';

export function ContactSection({ mp }: { mp: Mp }) {
  const c = mp.contact;
  const committees = mp.committees ?? [];
  const hasContact = c && (c.emails.length || c.phones.length || c.address || c.socials.length);
  if (!hasContact && !committees.length) return null;

  return (
    <DataSection
      icon={<Mail size={20} />}
      kicker='Reach & roles'
      title='Contact & committees'
      sub='Public contact details as published by the Lok Sabha Secretariat.'
      src='sansad'
    >
      <div className='grid gap-x-10 gap-y-6 sm:grid-cols-2'>
        <div className='flex flex-col gap-3'>
          {c.emails.map((e) => (
            <a
              key={e}
              href={`mailto:${e}`}
              className='hover:text-accent focus-visible:ring-ink/40 flex items-center gap-2 text-sm break-all transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
            >
              <Mail size={13} className='text-ink-soft shrink-0' /> {e}
            </a>
          ))}
          {c.phones.map((p) => (
            <a
              key={p}
              href={`tel:${p}`}
              className='hover:text-accent focus-visible:ring-ink/40 flex items-center gap-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
            >
              <Phone size={13} className='text-ink-soft shrink-0' /> {p}
            </a>
          ))}
          {c.address && (
            <p className='text-ink-soft flex items-start gap-2 text-sm'>
              <MapPin size={13} className='mt-0.5 shrink-0' /> {c.address}
            </p>
          )}
          {c.socials.length > 0 && (
            <div className='mt-1 flex flex-wrap gap-2'>
              {c.socials.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='border-border hover:border-ink focus-visible:ring-ink/40 inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] tracking-wide capitalize transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
                >
                  <Link2 size={10} /> {s.platform}
                </a>
              ))}
            </div>
          )}
        </div>

        {committees.length > 0 && (
          <div>
            <p className='eyebrow mb-2 flex items-center gap-1.5'>
              <Users size={12} /> Committee membership
            </p>
            <ul className='border-border border-t'>
              {committees.map((cm, i) => (
                <li
                  key={i}
                  className='border-border flex items-baseline justify-between gap-3 border-b py-2 text-sm'
                >
                  <span className='text-balance'>{cm.name}</span>
                  {cm.role && (
                    <span className='text-ink-soft font-mono text-[11px]'>{cm.role}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DataSection>
  );
}
