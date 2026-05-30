import { ALL_MPS, toSlim, parties, states } from "@/lib/data";
import { MpBrowser } from "@/components/MpBrowser";
import { Gavel, Coins, Vote, MicOff } from "lucide-react";

function Stat({ icon, value, label, token }: { icon: React.ReactNode; value: string; label: string; token?: string }) {
  return (
    <div className="neu-raised flex items-center gap-3 rounded-2xl p-4">
      <span className="neu-inset-sm grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ color: token }}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-none" style={{ color: token }}>{value}</div>
        <div className="mt-1 text-[11px] leading-tight text-ink-soft">{label}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const slim = ALL_MPS.map(toSlim);
  const crimDenom = ALL_MPS.filter((m) => m.criminal_cases != null).length || 1;
  const withCrim = ALL_MPS.filter((m) => (m.criminal_cases ?? 0) > 0).length;
  const utilArr = ALL_MPS.map((m) => m.mplads_utilisation_pct).filter((x): x is number => x != null);
  const avgUtil = Math.round(utilArr.reduce((s, x) => s + x, 0) / (utilArr.length || 1));
  const notaSeats = ALL_MPS.filter((m) => m.nota_gt_margin).length;
  const zeroQ = ALL_MPS.filter((m) => m.questions === 0).length;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <section className="py-10 sm:py-14">
        <h1 className="text-balance text-3xl font-bold leading-tight sm:text-5xl">
          The people's record of <span className="text-primary">their representatives.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-balance text-sm leading-relaxed text-ink-soft sm:text-base">
          Every elected member of the 18th Lok Sabha, on one page each — attendance, declared assets &amp; cases,
          fund utilisation, and how they won. Only public records. Every figure cites its source.
        </p>
      </section>

      <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Gavel size={18} />} token="var(--color-danger)" value={`${Math.round((withCrim / crimDenom) * 100)}%`} label={`of MPs declared criminal cases (${withCrim})`} />
        <Stat icon={<Coins size={18} />} token="var(--color-warning)" value={`${avgUtil}%`} label="average MPLADS funds actually spent" />
        <Stat icon={<Vote size={18} />} token="var(--color-primary)" value={`${notaSeats}`} label="seats where NOTA beat the victory margin" />
        <Stat icon={<MicOff size={18} />} token="var(--color-ink)" value={`${zeroQ}`} label="MPs asked zero questions all term" />
      </section>

      <MpBrowser mps={slim} parties={parties()} states={states()} />
    </main>
  );
}
