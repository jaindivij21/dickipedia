import type { ReactNode } from 'react';
import { SourceCredit } from '@/components/ui/SourceCredit';
import { LastUpdated } from '@/components/ui/LastUpdated';
import type { SrcKey } from '@/lib/sources';

export function DataSection({
  icon,
  kicker,
  title,
  sub,
  src,
  updatedAt,
  children,
}: {
  icon: ReactNode;
  kicker: string;
  title: string;
  sub?: string;
  src?: SrcKey;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <section className='mt-14'>
      <div className='rule-top relative pt-5'>
        <span aria-hidden className='bg-accent absolute top-0 left-0 h-0.5 w-10' />
        <div className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <span className='border-border bg-surface-2 text-ink grid h-11 w-11 shrink-0 place-items-center rounded-lg border'>
              {icon}
            </span>
            <div>
              <p className='eyebrow'>{kicker}</p>
              <h2 className='font-serif text-2xl leading-tight font-bold tracking-[-0.01em] text-balance sm:text-[1.65rem]'>
                {title}
              </h2>
            </div>
          </div>
          {src && (
            <div className='shrink-0 pt-1'>
              <SourceCredit src={src} />
            </div>
          )}
        </div>
        {sub && <p className='text-ink-soft mt-3 max-w-[68ch] text-sm leading-relaxed'>{sub}</p>}
      </div>
      <div className='mt-6'>{children}</div>
      {updatedAt && (
        <p className='mt-4'>
          <LastUpdated date={updatedAt} />
        </p>
      )}
    </section>
  );
}
