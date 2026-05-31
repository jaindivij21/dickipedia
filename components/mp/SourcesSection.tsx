import { ExternalLink, BookOpen, ArrowUpRight } from 'lucide-react';
import { SRC, SRC_KEYS } from '@/lib/sources';
import { DataSection } from '@/components/ui/DataSection';

export function SourcesSection() {
  return (
    <DataSection icon={<BookOpen size={20} />} kicker='Provenance' title='Sources & method'>
      <ul className='grid gap-3 sm:grid-cols-2'>
        {SRC_KEYS.map((key) => (
          <li key={key}>
            <a
              href={SRC[key].url}
              target='_blank'
              rel='noopener noreferrer'
              className='border-border hover:border-ink/25 hover:bg-surface-2 group focus-visible:ring-ink/40 flex items-center justify-between gap-2 rounded-lg border px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
            >
              <span className='flex min-w-0 items-center gap-2 font-mono text-[11px] break-words'>
                <ExternalLink size={12} className='text-ink-soft shrink-0' /> {SRC[key].label}
              </span>
              <ArrowUpRight
                size={14}
                className='text-ink-soft group-hover:text-accent shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none'
              />
            </a>
          </li>
        ))}
      </ul>
      <p className='text-ink-soft mt-4 max-w-[68ch] text-sm leading-relaxed'>
        dickipedia reports public records and the arithmetic on them, and cites every figure; it
        authors no accusations. Criminal data is reproduced as self-declared in sworn affidavits
        (pending ≠ convicted). Electoral-bond totals are party-level. Spot an error? It&rsquo;s open
        data — corrections welcome on GitHub.
      </p>
    </DataSection>
  );
}
