export function CriminalStatBox({
  total,
  seriousCount,
  otherCount,
  mynetaSerious,
}: {
  total: number;
  seriousCount: number;
  otherCount: number;
  mynetaSerious: boolean | null;
}) {
  return (
    <div className='border-border bg-surface-2 border'>
      <div className='divide-border grid grid-cols-2 divide-x'>
        <div className='p-4'>
          <p className='text-ink-soft font-mono text-[11px]'>Cite a serious IPC section</p>
          <p className='text-warning font-serif text-2xl leading-none font-bold'>
            {seriousCount}
            <span className='text-ink-soft text-sm font-normal'> of {total}</span>
          </p>
        </div>
        <div className='p-4'>
          <p className='text-ink-soft font-mono text-[11px]'>Other declared cases</p>
          <p className='font-serif text-2xl leading-none font-bold'>{otherCount}</p>
        </div>
      </div>
      <p className='border-border text-ink-soft border-t px-4 py-2 text-[11px] leading-snug'>
        &ldquo;Serious&rdquo; follows the ADR / MyNeta criteria (offence punishable by 5+ years,
        non-bailable, electoral, against the State, or a crime against women); derived from the
        self-declared sections.
        {mynetaSerious != null && (
          <>
            {' '}
            MyNeta&rsquo;s own analysis{' '}
            <span className='text-ink font-medium'>
              {mynetaSerious ? 'lists' : 'does not list'}
            </span>{' '}
            this MP among winners with declared serious criminal cases.
          </>
        )}
      </p>
    </div>
  );
}
