import type { ReactNode } from 'react';
import type { Mp } from '@/lib/data';
import { buildLede } from '@/lib/bio';
import { SRC, type SrcKey } from '@/lib/sources';

const LINK =
  'hover:text-accent underline-offset-2 transition-colors hover:underline motion-reduce:transition-none';

function Lede({ children }: { children: ReactNode }) {
  return <p className='text-ink-soft mt-3 max-w-[60ch] leading-relaxed text-pretty'>{children}</p>;
}

export function MpLede({ mp }: { mp: Mp }) {
  if (mp.bio?.text) {
    return (
      <>
        <Lede>{mp.bio.text}</Lede>
        <p className='text-ink-soft mt-1.5 text-xs'>
          From{' '}
          <a href={mp.bio.url} target='_blank' rel='noopener noreferrer' className={LINK}>
            Wikipedia
          </a>{' '}
          · {mp.bio.license} · every figure below traces to the{' '}
          <span className='mark-accent'>public record</span>.
        </p>
      </>
    );
  }

  const { sentences, sources } = buildLede(mp);
  return (
    <>
      <Lede>{sentences.join(' ')}</Lede>
      <p className='text-ink-soft mt-1.5 text-xs'>
        Compiled from the <span className='mark-accent'>public record</span> —{' '}
        {sources.map((key: SrcKey, i) => (
          <span key={key}>
            {i > 0 ? ', ' : ''}
            <a href={SRC[key].url} target='_blank' rel='noopener noreferrer' className={LINK}>
              {SRC[key].label}
            </a>
          </span>
        ))}
        . Every figure below traces to its source.
      </p>
    </>
  );
}
