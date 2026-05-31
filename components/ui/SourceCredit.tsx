import { ExternalLink } from 'lucide-react';
import { SRC, type SrcKey } from '@/lib/sources';

export function SourceCredit({ src, href }: { src: SrcKey; href?: string }) {
  return (
    <a
      href={href ?? SRC[src].url}
      target='_blank'
      rel='noopener noreferrer'
      className='text-ink-soft hover:text-ink focus-visible:ring-ink/40 inline-flex items-center gap-1 rounded-sm font-mono text-[10px] tracking-wide transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none'
    >
      <ExternalLink size={10} /> Source: {SRC[src].label}
    </a>
  );
}
