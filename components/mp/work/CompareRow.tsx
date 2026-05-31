import { CompareBar } from '@/components/charts';

export function CompareRow({
  label,
  value,
  average,
  max,
  display,
  averageDisplay,
}: {
  label: string;
  value: number;
  average: number;
  max: number;
  display: string;
  averageDisplay: string;
}) {
  const color = value >= average ? 'var(--color-success)' : 'var(--color-warning)';
  return (
    <div className='flex items-center gap-3'>
      <span className='text-ink-soft w-24 shrink-0 font-mono text-[11px]'>{label}</span>
      <CompareBar value={value} average={average} max={max} color={color} />
      <span className='w-28 shrink-0 text-right font-mono text-[11px]'>
        <span className='text-ink font-bold'>{display}</span>
        <span className='text-ink-soft'> · house {averageDisplay}</span>
      </span>
    </div>
  );
}
