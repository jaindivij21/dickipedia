import { Sigma, ExternalLink } from 'lucide-react';
import type { Mp, Inference } from '@/lib/data';
import { SEVERITY } from '@/lib/constants';
import { DataSection } from '@/components/mp/DataSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { SRC, type SrcKey } from '@/lib/sources';

function Row({ inf }: { inf: Inference }) {
  const sev = SEVERITY[inf.severity];
  return (
    <li className='border-border border-b py-4 last:border-0'>
      <div className='flex items-start gap-3'>
        <span
          aria-hidden
          className='mt-1.5 h-2 w-2 shrink-0 rounded-full'
          style={{ backgroundColor: sev.token ?? 'var(--color-ink-soft)' }}
        />
        <div className='min-w-0'>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
            <h3 className='font-serif text-lg leading-tight font-bold text-balance'>
              {inf.headline}
            </h3>
            <span
              className='font-mono text-[10px] tracking-wide uppercase'
              style={{ color: sev.token ?? 'var(--color-ink-soft)' }}
            >
              {sev.label}
            </span>
          </div>
          <p className='text-ink-soft mt-1 max-w-[68ch] text-sm leading-relaxed'>{inf.detail}</p>
          <div className='mt-2 flex flex-wrap gap-2'>
            {inf.sources.map((key) => {
              const s = SRC[key as SrcKey];
              if (!s) return null;
              return (
                <a
                  key={key}
                  href={s.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-ink-soft hover:text-ink focus-visible:ring-ink/40 inline-flex items-center gap-1 font-mono text-[10px] tracking-wide transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
                >
                  <ExternalLink size={10} /> {s.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </li>
  );
}

export function InferencesSection({ mp }: { mp: Mp }) {
  const inferences = mp.inferences ?? [];
  return (
    <DataSection
      icon={<Sigma size={20} />}
      kicker='What the numbers suggest'
      title='Read between the lines'
      sub='Arithmetic on the public record — cross-checking what was declared, attended, debated, asked and spent. These are observations about the figures, each cited to its source. dickipedia draws no conclusions about any individual.'
    >
      {inferences.length ? (
        <ul>
          {inferences.map((inf, i) => (
            <Row key={`${inf.key}-${i}`} inf={inf} />
          ))}
        </ul>
      ) : (
        <EmptyState message='No notable patterns surfaced from the available public record.' />
      )}
    </DataSection>
  );
}
