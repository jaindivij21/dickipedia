export function Bar({
  value,
  max,
  color,
  height = 10,
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
}) {
  const frac = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div className='bg-surface-2 w-full overflow-hidden rounded-full' style={{ height }}>
      <div
        className='h-full rounded-full'
        style={{ width: `${frac * 100}%`, background: color, minWidth: frac > 0 ? 4 : 0 }}
      />
    </div>
  );
}

export function CompareBar({
  value,
  average,
  max,
  color,
  height = 10,
}: {
  value: number;
  average: number;
  max: number;
  color: string;
  height?: number;
}) {
  const frac = Math.max(0, Math.min(1, max ? value / max : 0));
  const avgFrac = Math.max(0, Math.min(1, max ? average / max : 0));
  return (
    <div className='bg-surface-2 relative w-full overflow-hidden rounded-full' style={{ height }}>
      <div
        className='h-full rounded-full'
        style={{ width: `${frac * 100}%`, background: color, minWidth: frac > 0 ? 4 : 0 }}
      />
      <span
        aria-hidden
        className='bg-ink absolute top-0 h-full w-px'
        style={{ left: `${avgFrac * 100}%` }}
      />
    </div>
  );
}
