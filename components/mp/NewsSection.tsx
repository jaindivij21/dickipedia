import { Newspaper, ExternalLink } from 'lucide-react';
import type { Mp, NewsItem } from '@/lib/data';
import { DataSection } from '@/components/mp/DataSection';

const fmtDate = (iso: string): string =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

function Row({ item }: { item: NewsItem }) {
  return (
    <li className='border-border border-b py-3 last:border-0'>
      <a
        href={item.url}
        target='_blank'
        rel='noopener noreferrer'
        className='group focus-visible:ring-ink/40 block focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
      >
        <h3 className='group-hover:text-accent font-serif text-lg leading-tight font-bold text-balance transition-colors'>
          {item.title}
        </h3>
        <span className='text-ink-soft mt-1 inline-flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase'>
          {item.publisher}
          {item.date && ` · ${fmtDate(item.date)}`}
          <ExternalLink size={10} />
        </span>
      </a>
    </li>
  );
}

export function NewsSection({ mp }: { mp: Mp }) {
  const items = (mp.news ?? []).filter((n) => !n.flagged);
  if (!items.length) return null;
  return (
    <DataSection
      icon={<Newspaper size={20} />}
      kicker='Press coverage'
      title='In the news'
      sub='Recent third-party press matched to this MP via an automated news search — aggregated headlines linking out to the original publishers. These are the publishers’ own words: not verified by dickipedia, not one of the public registries, and excluded from the accountability score. An automated match may occasionally be imperfect.'
      src='news'
    >
      <ul>
        {items.map((item, i) => (
          <Row key={`${item.url}-${i}`} item={item} />
        ))}
      </ul>
    </DataSection>
  );
}
