import type { ReactNode } from 'react';

export function StatGrid({ cols = 4, children }: { cols?: 3 | 4; children: ReactNode }) {
  const colClass = cols === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';
  return <div className={`grid gap-3 ${colClass}`}>{children}</div>;
}

export function StatCell({
  figure,
  label,
  token,
  sub,
  icon,
}: {
  figure: string;
  label: string;
  token?: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className='border-border bg-surface hover:border-ink/25 hover:bg-surface-2 flex flex-col gap-2 rounded-lg border p-4 transition-colors motion-reduce:transition-none sm:p-5'>
      <span className='text-ink-soft flex items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase'>
        {icon && <span style={token ? { color: token } : undefined}>{icon}</span>}
        {label}
      </span>
      <span
        className='font-serif text-[1.4rem] leading-tight font-bold tracking-[-0.01em] sm:text-2xl'
        style={token ? { color: token } : undefined}
      >
        {figure}
      </span>
      {token && (
        <span aria-hidden className='h-0.5 w-8 rounded-full' style={{ background: token }} />
      )}
      {sub && <span className='text-ink-soft text-[11px] leading-tight'>{sub}</span>}
    </div>
  );
}
