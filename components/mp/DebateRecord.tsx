import type { Mp } from '@/lib/mp/data';
import { TOP_DEBATE_TYPES } from '@/lib/mp/constants';
import { BarList } from '@/components/charts';

export function DebateRecord({ mp }: { mp: Mp }) {
  const titles = mp.prs_detail?.debate_titles ?? [];
  if (!titles.length) return null;

  const byType = new Map<string, number>();
  for (const d of titles) {
    const key = d.type?.trim() || 'Other';
    byType.set(key, (byType.get(key) ?? 0) + 1);
  }
  const items = [...byType.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, TOP_DEBATE_TYPES);

  return (
    <div className='border-border bg-surface-2 mt-4 rounded-lg border p-5'>
      <p className='eyebrow mb-3'>How they used the floor · interventions by type</p>
      <BarList items={items} labelClass='w-52' />
      <p className='text-ink-soft mt-3 text-xs'>
        {titles.length} recorded interventions across {byType.size} type
        {byType.size === 1 ? '' : 's'}, as logged by PRS.
      </p>
    </div>
  );
}
