// Pipeline step 12: declared-wealth time-series across an MP's own sworn affidavits. Pure transform
// (no network) over step 11's parse: MyNeta's "Other Elections" table on each 2024 candidate page
// links the SAME person across past elections (Lok Sabha + state assembly), so a series spans as far
// back as MyNeta has data. Each point is a discrete sworn affidavit, tagged by its election. Ministerial
// asset declarations (not elections) are excluded. Partial coverage is expected and honest.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import type { Provenance } from './lib/types.ts';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
const CURRENT_YEAR = 2024;
const CANDIDATE_2024 = (id: number): string =>
  `https://myneta.info/LokSabha2024/candidate.php?candidate_id=${id}`;
const MINISTERIAL = /council of ministers|cabinet|^minister/i;
const LOK_SABHA = /lok\s*sabha|loksabha/i;
const PROVENANCE: Provenance = {
  source: 'ADR / MyNeta.info "Other Elections" cross-election table (sworn ECI affidavits)',
  license: 'Non-commercial; display + attribution',
  url: 'https://myneta.info/LokSabha2024/',
};

interface CrosswalkRow {
  pc_id: string;
  myneta: { candidate_id: number | null };
}
interface Myneta2024Row {
  candidate_id: number;
  total_assets: number | null;
}
interface PriorAffidavit {
  label: string;
  body: string;
  year: number;
  total_assets: number | null;
  declared_cases: number;
}
interface MynetaDeepRow {
  pc_id: string;
  prior_affidavits: PriorAffidavit[];
  compare_url: string | null;
}
interface AssetYear {
  year: number;
  total_assets: number | null;
  source_url: string;
  label: string;
}
interface HistoryRow {
  pc_id: string;
  series: AssetYear[];
  _provenance: Provenance;
}

const load = async <T>(f: string, base: URL): Promise<T> =>
  JSON.parse(await readFile(new URL(f, base), 'utf8')) as T;

// Same-year collision: prefer a Lok Sabha affidavit over assembly/other, then the larger declaration.
// Deterministic so the canonical JSON is reproducible.
function preferred(a: AssetYear, b: AssetYear): AssetYear {
  const al = LOK_SABHA.test(a.label),
    bl = LOK_SABHA.test(b.label);
  if (al !== bl) return al ? a : b;
  return (b.total_assets ?? -1) > (a.total_assets ?? -1) ? b : a;
}

async function main(): Promise<void> {
  const crosswalk = await load<CrosswalkRow[]>('crosswalk.json', CANON);
  const myneta2024 = await load<Myneta2024Row[]>('myneta_2024.json', RAW);
  const deep = await load<MynetaDeepRow[]>('myneta_deep.json', RAW);

  const assets2024 = new Map<number, number | null>();
  for (const m of myneta2024) assets2024.set(m.candidate_id, m.total_assets);
  const deepByPc = new Map<string, MynetaDeepRow>();
  for (const d of deep) deepByPc.set(d.pc_id, d);

  const out: HistoryRow[] = crosswalk.map((s) => {
    const cid = s.myneta.candidate_id;
    const d = deepByPc.get(s.pc_id);
    const points: AssetYear[] = [];
    for (const p of d?.prior_affidavits ?? []) {
      if (MINISTERIAL.test(p.body) || p.total_assets == null) continue;
      points.push({
        year: p.year,
        total_assets: p.total_assets,
        source_url: d?.compare_url ?? (cid != null ? CANDIDATE_2024(cid) : PROVENANCE.url),
        label: p.label,
      });
    }
    const current = cid != null ? (assets2024.get(cid) ?? null) : null;
    if (current != null && cid != null)
      points.push({
        year: CURRENT_YEAR,
        total_assets: current,
        source_url: CANDIDATE_2024(cid),
        label: `Lok Sabha ${CURRENT_YEAR}`,
      });

    const byYear = new Map<number, AssetYear>();
    for (const p of points) {
      const prev = byYear.get(p.year);
      byYear.set(p.year, prev ? preferred(prev, p) : p);
    }
    const series = [...byYear.values()].sort((a, b) => a.year - b.year);
    return { pc_id: s.pc_id, series, _provenance: PROVENANCE };
  });

  await mkdir(RAW, { recursive: true });
  await writeFile(new URL('myneta_history.json', RAW), JSON.stringify(out, null, 2));
  const multi = out.filter((r) => r.series.length >= 2).length;
  const three = out.filter((r) => r.series.length >= 3).length;
  const earliest = Math.min(...out.flatMap((r) => r.series.map((p) => p.year)).filter(Boolean));
  console.log(
    `Wealth history: ${out.length} MPs (multi-point ${multi} · 3+ point ${three} · earliest ${earliest})`,
  );
  console.log('Wrote data/raw/myneta_history.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
