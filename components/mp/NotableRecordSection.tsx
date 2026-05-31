import { Landmark, ExternalLink } from 'lucide-react';
import type { Mp, NotableRecordEntry, PublicResponse } from '@/lib/data';
import { DataSection } from '@/components/mp/DataSection';

const RESPONSE_TOKEN: Record<PublicResponse, string | undefined> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  divided: 'var(--color-warning)',
  neutral: undefined,
};
const RESPONSE_LABEL: Record<PublicResponse, string> = {
  positive: 'Positive',
  negative: 'Negative',
  divided: 'Divided',
  neutral: 'Neutral',
};

function ResponseChip({ response }: { response: PublicResponse }) {
  const token = RESPONSE_TOKEN[response];
  return (
    <span
      className='border-border text-ink-soft inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase'
      style={
        token
          ? {
              color: token,
              borderColor: token,
              backgroundColor: `color-mix(in srgb, ${token} 8%, transparent)`,
            }
          : undefined
      }
    >
      Public response · {RESPONSE_LABEL[response]}
    </span>
  );
}

function Entry({ entry }: { entry: NotableRecordEntry }) {
  return (
    <li className='border-border border-b py-3 last:border-0'>
      <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5'>
        <h3 className='font-serif text-lg leading-snug font-bold text-balance'>{entry.title}</h3>
        {entry.response && <ResponseChip response={entry.response} />}
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
