import { writeFile, readFile } from 'node:fs/promises';
import { BANNED } from './lib/text.ts';

const CANON = new URL('../data/canonical/', import.meta.url);

const GROWTH_NOTABLE = 100;
const GROWTH_FLAG = 300;
const GROWTH_EXTREME = 1000;
const INCOME_RATIO_FLAG = 5;
const INCOME_RATIO_EXTREME = 20;
const MPLADS_UNDERSPENT_NOTABLE = 50;
const MPLADS_UNDERSPENT_FLAG = 25;
const ATT_BOTTOM_PCTILE = 10;
const ASSET_TOP_PCTILE = 99;

const SEV_RANK: Record<string, number> = { info: 1, notable: 2, flag: 3, extreme: 4 };

const SERIOUS_SECTIONS: Record<string, { label: string; tier: 'flag' | 'extreme' }> = {
  '302': { label: 'murder', tier: 'extreme' },
  '307': { label: 'attempt to murder', tier: 'extreme' },
  '304': { label: 'culpable homicide', tier: 'extreme' },
  '376': { label: 'rape', tier: 'extreme' },
  '396': { label: 'dacoity with murder', tier: 'extreme' },
  '364': { label: 'kidnapping', tier: 'extreme' },
  '365': { label: 'kidnapping', tier: 'extreme' },
  '326': { label: 'voluntarily causing grievous hurt', tier: 'flag' },
  '420': { label: 'cheating', tier: 'flag' },
  '467': { label: 'forgery of valuable security', tier: 'flag' },
};

type Severity = 'info' | 'notable' | 'flag' | 'extreme';
type SrcKey = 'eci' | 'prs' | 'sansad' | 'myneta' | 'mplads' | 'bonds';
interface Inference {
  key: string;
  severity: Severity;
  headline: string;
  detail: string;
  numbers: Record<string, number | string | null>;
  sources: SrcKey[];
}

const rupee = (n: number): string => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e9 ? 0 : 2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};
const pctRank = (sorted: number[], v: number): number => {
  if (!sorted.length) return 50;
  let lo = 0;
  for (const x of sorted) if (x < v) lo++;
  return Math.round((lo / sorted.length) * 100);
};

interface Mp {
  pc_id: string;
  mp_name: string;
  minister?: boolean | null;
  attendance_pct: number | null;
  questions: number | null;
  nota_gt_margin: boolean;
  nota_votes: number;
  margin_votes: number;
  mplads_utilisation_pct: number | null;
  mplads_unspent: number | null;
  assets_history?: { year: number; total_assets: number | null }[];
  assets_history_pct?: number | null;
  charges_framed_count?: number | null;
  pending_cases?: number | null;
  convicted_cases?: number | null;
  criminal_detail?: {
    pending: { sections: string[] }[];
    convicted: { sections: string[] }[];
  } | null;
  income?: { itr: { person: string; income: number | null }[] } | null;
  prs_detail?: { debate_titles?: { type: string | null }[] } | null;
  inferences?: Inference[];
  inference_count?: number;
  top_inference_severity?: Severity | null;
}

function seriousSections(mp: Mp): { sections: string[]; tier: Severity; labels: string[] } {
  const all = [
    ...(mp.criminal_detail?.pending ?? []),
    ...(mp.criminal_detail?.convicted ?? []),
  ].flatMap((c) => c.sections);
  const hits = [...new Set(all)].filter((s) => SERIOUS_SECTIONS[s]);
  let tier: Severity = 'flag';
  const labels = new Set<string>();
  for (const s of hits) {
    const info = SERIOUS_SECTIONS[s];
    labels.add(info.label);
    if (info.tier === 'extreme') tier = 'extreme';
  }
  return { sections: hits, tier, labels: [...labels] };
}

function build(mp: Mp, attSorted: number[], growthSorted: number[]): Inference[] {
  const out: Inference[] = [];
  const series = (mp.assets_history ?? []).filter((p) => p.total_assets != null);
  const growth = mp.assets_history_pct ?? null;

  if (series.length >= 2 && growth != null && growth >= GROWTH_NOTABLE) {
    const first = series[0],
      last = series[series.length - 1];
    const severity: Severity =
      growth >= GROWTH_EXTREME ? 'extreme' : growth >= GROWTH_FLAG ? 'flag' : 'notable';
    const pr = pctRank(growthSorted, growth);
    out.push({
      key: 'asset_growth',
      severity,
      headline: `Declared assets grew ${growth.toLocaleString('en-IN')}% across ${series.length} affidavits`,
      detail: `From ${rupee(first.total_assets as number)} (${first.year}) to ${rupee(last.total_assets as number)} (${last.year})${pr >= ASSET_TOP_PCTILE ? ` — among the steepest on record (top ${100 - pr}% of MPs)` : ''}.`,
      numbers: {
        pct: growth,
        from: first.total_assets,
        to: last.total_assets,
        from_year: first.year,
        to_year: last.year,
      },
      sources: ['myneta'],
    });
  }

  const itr = (mp.income?.itr ?? []).filter((r) => /self/i.test(r.person) && (r.income ?? 0) > 0);
  if (series.length >= 2 && itr.length) {
    const delta =
      (series[series.length - 1].total_assets as number) - (series[0].total_assets as number);
    const declaredIncome = itr.reduce((s, r) => s + (r.income ?? 0), 0);
    if (delta > 0 && declaredIncome > 0) {
      const ratio = delta / declaredIncome;
      if (ratio >= INCOME_RATIO_FLAG) {
        out.push({
          key: 'asset_growth_vs_income',
          severity: ratio >= INCOME_RATIO_EXTREME ? 'extreme' : 'flag',
          headline: `Declared assets rose ${Math.round(ratio)}× faster than declared income`,
          detail: `Assets increased by ${rupee(delta)} between affidavits, while declared income across ${itr.length} ITR years totalled ${rupee(declaredIncome)}.`,
          numbers: {
            ratio: Math.round(ratio),
            asset_increase: Math.round(delta),
            declared_income: declaredIncome,
            itr_years: itr.length,
          },
          sources: ['myneta'],
        });
      }
    }
  }

  if (!mp.minister && mp.attendance_pct != null) {
    const pr = pctRank(attSorted, mp.attendance_pct);
    if (pr <= ATT_BOTTOM_PCTILE)
      out.push({
        key: 'attendance_bottom_decile',
        severity: pr <= 3 ? 'flag' : 'notable',
        headline: `Attendance in the bottom ${Math.max(pr, 1)}% of all MPs`,
        detail: `Attended ${mp.attendance_pct}% of sittings, against a house average that runs far higher.`,
        numbers: { attendance: mp.attendance_pct, percentile: pr },
        sources: ['prs'],
      });
  }

  if (mp.questions === 0 && !mp.minister && growth != null && growth > 0)
    out.push({
      key: 'silent_but_richer',
      severity: 'flag',
      headline: `Asked zero questions, yet declared assets rose ${growth.toLocaleString('en-IN')}%`,
      detail: `No starred or unstarred questions recorded, while declared wealth grew between affidavits.`,
      numbers: { questions: 0, growth_pct: growth },
      sources: ['prs', 'myneta'],
    });

  if (mp.mplads_utilisation_pct != null && mp.mplads_utilisation_pct < MPLADS_UNDERSPENT_NOTABLE)
    out.push({
      key: 'mplads_underspent',
      severity: mp.mplads_utilisation_pct < MPLADS_UNDERSPENT_FLAG ? 'flag' : 'notable',
      headline: `${Math.round(100 - mp.mplads_utilisation_pct)}% of development funds lie unspent`,
      detail: `Only ${Math.round(mp.mplads_utilisation_pct)}% of MPLADS local-area funds were spent${mp.mplads_unspent ? ` — ${rupee(mp.mplads_unspent)} unspent` : ''}.`,
      numbers: {
        utilisation_pct: Math.round(mp.mplads_utilisation_pct),
        unspent: mp.mplads_unspent,
      },
      sources: ['mplads'],
    });

  if (mp.nota_gt_margin)
    out.push({
      key: 'nota_over_margin',
      severity: 'notable',
      headline: `More voters chose NOTA than the victory margin`,
      detail: `NOTA drew ${mp.nota_votes.toLocaleString('en-IN')} votes; the seat was won by ${mp.margin_votes.toLocaleString('en-IN')}.`,
      numbers: { nota: mp.nota_votes, margin: mp.margin_votes },
      sources: ['eci'],
    });

  if ((mp.charges_framed_count ?? 0) > 0)
    out.push({
      key: 'charges_framed',
      severity: 'flag',
      headline: `${mp.charges_framed_count} declared case(s) where charges have been framed`,
      detail: `Self-declared in the sworn affidavit — pending ≠ convicted; framing of charges is a court stage, not a verdict.`,
      numbers: {
        charges_framed: mp.charges_framed_count ?? 0,
        pending: mp.pending_cases ?? 0,
        convicted: mp.convicted_cases ?? 0,
      },
      sources: ['myneta'],
    });

  const serious = seriousSections(mp);
  if (serious.sections.length)
    out.push({
      key: 'serious_sections',
      severity: serious.tier,
      headline: `Declared case(s) cite IPC sections for ${serious.labels.join(', ')}`,
      detail: `Sections ${serious.sections.join(', ')} appear in the self-declared affidavit. Pending ≠ convicted; reproduced as recorded.`,
      numbers: { sections: serious.sections.join(', ') },
      sources: ['myneta'],
    });

  const interventions = mp.prs_detail?.debate_titles?.length ?? 0;
  if (!mp.minister && mp.attendance_pct != null && mp.prs_detail != null && interventions === 0) {
    const alsoSilentQ = mp.questions === 0;
    out.push({
      key: 'floor_silent',
      severity: alsoSilentQ ? 'flag' : 'notable',
      headline: `Left no recorded intervention on the floor of the House`,
      detail: `PRS lists no debate, special mention or other intervention for this member across the 18th Lok Sabha.${alsoSilentQ ? ' No starred or unstarred questions were recorded either.' : ''}`,
      numbers: { interventions: 0, questions: mp.questions ?? null },
      sources: ['prs'],
    });
  }

  return out;
}

function guard(infs: Inference[]): void {
  for (const i of infs)
    for (const text of [i.headline, i.detail]) {
      const m = text.match(BANNED);
      if (m)
        throw new Error(`Banned accusatory phrasing "${m[0]}" in inference ${i.key}: "${text}"`);
    }
}

async function main(): Promise<void> {
  const mps = JSON.parse(await readFile(new URL('mps.json', CANON), 'utf8')) as Mp[];
  const attSorted = mps
    .filter((m) => !m.minister && m.attendance_pct != null)
    .map((m) => m.attendance_pct as number)
    .sort((a, b) => a - b);
  const growthSorted = mps
    .map((m) => m.assets_history_pct)
    .filter((x): x is number => x != null)
    .sort((a, b) => a - b);

  let total = 0;
  const histogram: Record<string, number> = {};
  for (const mp of mps) {
    const infs = build(mp, attSorted, growthSorted);
    guard(infs);
    infs.sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity]);
    mp.inferences = infs;
    mp.inference_count = infs.length;
    mp.top_inference_severity = infs.length ? infs[0].severity : null;
    total += infs.length;
    for (const i of infs) histogram[i.severity] = (histogram[i.severity] ?? 0) + 1;
  }

  await writeFile(new URL('mps.json', CANON), JSON.stringify(mps, null, 2));
  const withAny = mps.filter((m) => (m.inference_count ?? 0) > 0).length;
  console.log(
    `Inferences computed: ${total} across ${withAny}/${mps.length} MPs (extreme ${histogram.extreme ?? 0} · flag ${histogram.flag ?? 0} · notable ${histogram.notable ?? 0} · info ${histogram.info ?? 0})`,
  );
  console.log('Wrote data/canonical/mps.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
