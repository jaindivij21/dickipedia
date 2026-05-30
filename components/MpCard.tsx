import Link from "next/link";
import { MapPin, Gavel, CalendarCheck, Coins, AlertTriangle } from "lucide-react";
import { ScoreChip } from "./ScoreGauge";
import { pct } from "@/lib/format";
import type { SlimMp } from "@/lib/data";

const initials = (n: string) => n.replace(/^(Shri|Smt|Dr|Adv|Prof)\.?\s+/i, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function MpCard({ mp }: { mp: SlimMp }) {
  return (
    <Link href={`/mp/${mp.slug}`} className="neu-raised neu-press group block rounded-3xl p-4">
      <div className="flex items-center gap-3">
        {mp.photo ? (
          <img src={mp.photo} alt="" className="neu-inset-sm h-14 w-14 shrink-0 rounded-2xl object-cover" loading="lazy" />
        ) : (
          <span className="neu-inset-sm grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-sm text-ink-soft">{initials(mp.name)}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold leading-tight">{mp.name}</div>
          <div className="mt-1 flex items-center gap-1 truncate text-[11px] text-ink-soft">
            <MapPin size={11} className="shrink-0" /> {mp.pc} · <span className="font-bold text-primary">{mp.party}</span>
          </div>
        </div>
        <ScoreChip value={mp.score} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-ink-soft">
        <span className="neu-inset-sm flex items-center justify-center gap-1 rounded-lg py-1.5" title="Attendance">
          <CalendarCheck size={11} /> {mp.minister ? "Min." : pct(mp.attendance)}
        </span>
        <span className="neu-inset-sm flex items-center justify-center gap-1 rounded-lg py-1.5" style={{ color: (mp.criminal ?? 0) > 0 ? "var(--color-danger)" : undefined }} title="Declared criminal cases">
          <Gavel size={11} /> {mp.criminal ?? "—"}
        </span>
        <span className="neu-inset-sm flex items-center justify-center gap-1 rounded-lg py-1.5" title="MPLADS funds utilised">
          <Coins size={11} /> {pct(mp.mplads_util)}
        </span>
      </div>
      {mp.nota_gt_margin && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-warning">
          <AlertTriangle size={11} /> NOTA outpolled the victory margin
        </div>
      )}
    </Link>
  );
}
