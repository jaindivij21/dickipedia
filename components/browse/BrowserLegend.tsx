import { SCORE_BANDS, colorVar, type ScoreToken } from '@/lib/format';

function Dot({ token }: { token: ScoreToken }) {
  return (
    <span
      className='inline-block h-2 w-2 rounded-full'
      style={{ backgroundColor: colorVar(token) }}
    />
  );
}

export function BrowserLegend() {
  return (
    <div className='border-border text-ink-soft mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-b py-2.5 text-[11px]'>
      <span className='eyebrow text-ink'>Key</span>
      <span className='flex flex-wrap items-center gap-x-3 gap-y-1 font-mono'>
        {SCORE_BANDS.map((b, i) => {
          const lo = i === 0 ? 0 : SCORE_BANDS[i - 1].max;
          const range = b.max >= 100 ? `≥${lo}` : `${lo}–${b.max - 1}`;
          return (
            <span key={b.label} className='flex items-center gap-1.5'>
              <Dot token={b.token} /> {range} {b.label}
            </span>
          );
        })}
        <span className='text-ink-soft normal-case'>
          — the dot + numeral + underline beside each score
        </span>
      </span>
      <span className='font-mono'>
        ATT attendance · CASES criminal cases · FUNDS MPLADS spent · ASSETS declared assets
      </span>
    </div>
  );
}
