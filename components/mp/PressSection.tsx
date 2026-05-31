import { Mic, ExternalLink } from 'lucide-react';
import type { Mp } from '@/lib/data';
import { DataSection } from '@/components/mp/DataSection';

export function PressSection({ mp }: { mp: Mp }) {
  const press = mp.press_accountability;
  if (!press) return null;
  return (
    <DataSection
      icon={<Mic size={20} />}
      kicker='Press accountability'
      title='Facing the press'
      sub='A documented public-conduct note, cited to press reportage — not drawn from a public registry, and excluded from the accountability score.'
    >
      <div className='border-border bg-surface-2 rounded-lg border p-5'>
        <p className='leading-relaxed text-pretty'>{press.statement}</p>
        <div className='mt-4 flex flex-wrap gap-x-4 gap-y-2'>
          {press.sources.map((s) => (
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
        <p className='text-ink-soft mt-3 text-xs italic'>
          As of {press.as_of}. Reported by the press, not a public-registry record; stated as fact,
          not characterisation.
        </p>
      </div>
    </DataSection>
  );
}
