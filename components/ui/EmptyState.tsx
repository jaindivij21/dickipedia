import type { ReactNode } from 'react';

export function EmptyState({
  icon,
  message,
  action,
}: {
  icon?: ReactNode;
  message: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className='border-border bg-surface text-ink-soft flex flex-col items-center gap-2 rounded-lg border p-8 text-center text-sm'>
      {icon && <span className='text-ink-soft'>{icon}</span>}
      <p className='max-w-[52ch] leading-relaxed'>{message}</p>
      {action}
    </div>
  );
}
