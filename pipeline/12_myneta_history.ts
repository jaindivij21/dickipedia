// Pipeline step 12: declared-wealth time-series 2014 -> 2019 -> 2024. Each affidavit is a discrete sworn
// snapshot. 2024 from the winners index, 2019 from the recontest-comparison page (re-elected MPs), 2014
// cross-matched against the separate MyNeta ls2014 winners archive by constituency + name. Partial
// coverage is expected and honest: not every 2024 MP contested 2014/2019, so a series may hold 1-3 points.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { fetchText } from './lib/http.ts';
import { normConstituency, tokenSortRatio } from './lib/text.ts';
import { parseRupees } from './lib/money.ts';
import type { Provenance } from './lib/types.ts';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
const LS2014_INDEX = 'https://myneta.info/ls2014/index.php?action=show_winners&sort=default';
const LS2014_CANDIDATE = (id: number): string =>
  `https://myneta.info/ls2014/candidate.php?candidate_id=${id}`;
const CANDIDATE_2024 = (id: number): string =>
  `https://myneta.info/LokSabha2024/candidate.php?candidate_id=${id}`;
const RECONTEST_2019 =
  'https://myneta.info/LokSabha2024/index.php?action=recontestAssetsComparison';
const CONST_FUZZY = 88;
const NAME_FUZZY = 80;
const PROVENANCE: Provenance = {
  source: 'ADR / MyNeta.info (from ECI sworn affidavits; ls2014 + LokSabha2024 archives)',
  license: 'Non-commercial; display + attribution',
  url: 'https://myneta.info/',
};

interface CrosswalkRow {
  pc_id: string;
  pc_name_norm: string;
  eci_state: string;
  winner: string;
  myneta: { candidate_id: number | null };
}
interface Myneta2024Row {
  candidate_id: number;
  total_assets: number | null;
}
interface WealthRow {
  candidate_id: number | null;
  assets_2019: number | null;
  assets_2024: number | null;
}
interface Ls2014Row {
  candidate_id: number;
  name: string;
  constituency_norm: string;
  total_assets: number | null;
}
interface AssetYear {
  year: number;
  total_assets: number | null;
  source_url: string;
}
interface HistoryRow {
  pc_id: string;
  series: AssetYear[];
  _provenance: Provenance;
}

const load = async <T>(f: string): Promise<T> =>
  JSON.parse(await readFile(new URL(f, RAW), 'utf8')) as T;

function parse2014Index(html: string): Ls2014Row[] {
  const $ = cheerio.load(html);
  const rows: Ls2014Row[] = [];
  $('table.w3-table tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 8) return;
    const link = $(tds[1]).find("a[href*='candidate_id=']").last();
    const idm = (link.attr('href') || '').match(/candidate_id=(\d+)/);
    if (!idm) return;
    const constituencyRaw = $(tds[2]).text().trim();
    rows.push({
      candidate_id: Number(idm[1]),
      name: link.text().trim(),
      constituency_norm: normConstituency(constituencyRaw.split(':')[0]),
      total_assets: parseRupees($(tds[6]).text()),
    });
  });
  return rows;
}

async function main(): Promise<void> {
  const crosswalk = JSON.parse(
    await readFile(new URL('crosswalk.json', CANON), 'utf8'),
  ) as CrosswalkRow[];
  const myneta2024 = await load<Myneta2024Row[]>('myneta_2024.json');
  const wealth = await load<WealthRow[]>('myneta_wealth.json');

  const assets2024 = new Map<number, number | null>();
  for (const m of myneta2024) assets2024.set(m.candidate_id, m.total_assets);
  const assets2019 = new Map<number, number | null>();
  for (const w of wealth) if (w.candidate_id != null) assets2019.set(w.candidate_id, w.assets_2019);

  console.log('Fetching MyNeta ls2014 winners archive (one page)...');
  const idx2014 = parse2014Index(await fetchText(LS2014_INDEX));
  const byConst2014 = new Map<string, Ls2014Row[]>();
  for (const r of idx2014)
    (
      byConst2014.get(r.constituency_norm) ??
      byConst2014.set(r.constituency_norm, []).get(r.constituency_norm)!
    ).push(r);
  console.log(`  ls2014 winners parsed: ${idx2014.length}`);

  const match2014 = (s: CrosswalkRow): Ls2014Row | null => {
    let cands = byConst2014.get(s.pc_name_norm) ?? [];
    if (!cands.length)
      for (const [cn, rows] of byConst2014)
        if (tokenSortRatio(cn, s.pc_name_norm) >= CONST_FUZZY) {
          cands = rows;
          break;
        }
    if (!cands.length) return null;
    let best: Ls2014Row | null = null,
      bc = -1;
    for (const c of cands) {
      const sc = tokenSortRatio(s.winner, c.name);
      if (sc > bc) {
        bc = sc;
        best = c;
      }
    }
    return best && bc >= NAME_FUZZY ? best : null;
  };

  const out: HistoryRow[] = crosswalk.map((s) => {
    const cid = s.myneta.candidate_id;
    const series: AssetYear[] = [];
    const m2014 = match2014(s);
    if (m2014 && m2014.total_assets != null)
      series.push({
        year: 2014,
        total_assets: m2014.total_assets,
        source_url: LS2014_CANDIDATE(m2014.candidate_id),
      });
    const a2019 = cid != null ? (assets2019.get(cid) ?? null) : null;
    if (a2019 != null) series.push({ year: 2019, total_assets: a2019, source_url: RECONTEST_2019 });
    const a2024 = cid != null ? (assets2024.get(cid) ?? null) : null;
    if (a2024 != null && cid != null)
      series.push({ year: 2024, total_assets: a2024, source_url: CANDIDATE_2024(cid) });
    return {
      pc_id: s.pc_id,
      series: series.sort((a, b) => a.year - b.year),
      _provenance: PROVENANCE,
    };
  });

  await mkdir(RAW, { recursive: true });
  await writeFile(new URL('myneta_history.json', RAW), JSON.stringify(out, null, 2));
  const three = out.filter((r) => r.series.length >= 3).length;
  const two = out.filter((r) => r.series.length === 2).length;
  const got2014 = out.filter((r) => r.series.some((p) => p.year === 2014)).length;
  console.log(
    `Wealth history: ${out.length} MPs (3-point ${three} · 2-point ${two} · with 2014 ${got2014})`,
  );
  console.log('Wrote data/raw/myneta_history.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
