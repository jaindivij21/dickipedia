import type { ReactNode } from 'react';

export function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className='border-border flex items-start justify-between gap-3 border-b py-3 text-sm last:border-0'>
      <span className='text-ink-soft flex shrink-0 items-center gap-2 font-mono text-xs'>
        {icon}
        {label}
      </span>
      <span className='min-w-0 text-right font-medium text-balance break-words'>{value}</span>
    </div>
  );
}
