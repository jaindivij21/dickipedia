import type { ReactNode } from 'react';

export function Badge({
  token,
  children,
  className = 'px-2.5 py-1',
}: {
  token?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`border-border text-ink-soft inline-flex items-center gap-1.5 rounded-md border font-mono text-[10px] tracking-wide uppercase ${className}`}
      style={
        token
          ? {
              color: token,
              borderColor: token,
              backgroundColor: `color-mix(in srgb, ${token} 8%, transparent)`,
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}
