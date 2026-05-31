import { Landmark, ExternalLink } from 'lucide-react';
import type { Mp, NotableRecordEntry } from '@/lib/mp/data';
import { RESPONSE } from '@/lib/mp/constants';
import { DataSection } from '@/components/ui/DataSection';
import { Badge } from '@/components/ui/Badge';

function Entry({ entry }: { entry: NotableRecordEntry }) {
  return (
    <li className='border-border border-b py-3 last:border-0'>
      <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5'>
        <h3 className='font-serif text-lg leading-snug font-bold text-balance'>{entry.title}</h3>
        {entry.response && (
          <Badge token={RESPONSE[entry.response].token} className='shrink-0 px-2 py-0.5'>
            Public response · {RESPONSE[entry.response].label}
          </Badge>
        )}
      </div>
      {entry.detail && (
        <p className='text-ink-soft mt-1.5 max-w-[68ch] text-sm leading-relaxed'>{entry.detail}</p>
      )}
      <div className='mt-2 flex flex-wrap gap-x-4 gap-y-2'>
        {entry.sources.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target='_blank'
            rel='noopener noreferrer'
            className='text-ink-soft hover:text-ink focus-visible:ring-ink/40 inline-flex items-center gap-1 font-mono text-[10px] tracking-wide transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
          >
            <ExternalLink size={10} /> {s.publisher}
            {s.date ? ` · ${s.date}` : ''}
          </a>
        ))}
      </div>
    </li>
  );
}

export function NotableRecordSection({ mp }: { mp: Mp }) {
  const record = mp.notable_record;
  if (!record) return null;
  return (
    <DataSection
      icon={<Landmark size={20} />}
      kicker='Public record'
      title='Notable record'
      sub='Offices held and milestones from the public record, each cited. Curated for senior office-holders; not drawn from a public registry and excluded from the accountability score. Where reception is documented, a sourced “public response” marker reflects how the action was received in public and press reporting — not dickipedia’s view.'
    >
      <p className='eyebrow mb-3'>{record.office}</p>
      <ul>
        {record.entries.map((entry, i) => (
          <Entry key={`${entry.title}-${i}`} entry={entry} />
        ))}
      </ul>
    </DataSection>
  );
}
