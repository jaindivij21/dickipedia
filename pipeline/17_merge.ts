// Pipeline step 17: fold the deep Phase-2 raw sources into the canonical mps.json by pc_id (left join on
// the 543 spine, so a missing deep source is a null/empty block, never a dropped MP). Adds nested blocks
// (criminal detail, asset breakdown, liabilities, income, contracts, wealth history, PRS detail, contact,
// bio) plus hoisted scalars for sorting. Runs after 11-16; 18_inferences runs after this.
import { writeFile, readFile } from 'node:fs/promises';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
const MYNETA_2024 = 'https://myneta.info/LokSabha2024/';

const loadRaw = async <T>(f: string): Promise<T[]> => {
  try {
    return JSON.parse(await readFile(new URL(f, RAW), 'utf8')) as T[];
  } catch {
    return [];
  }
};
const byPc = <T extends { pc_id: string }>(rows: T[]): Map<string, T> =>
  new Map(rows.map((r) => [r.pc_id, r]));

interface MynetaDeepRow {
  pc_id: string;
  criminal: {
    count: number;
    ipc_summary: unknown[];
    pending: { charges_framed: boolean }[];
    convicted: unknown[];
  };
  assets: {
    movable_total: number | null;
    immovable_total: number | null;
    movable: unknown[];
    immovable: unknown[];
  };
  liabilities: { total: number | null; lines: unknown[] };
  income: { sources: unknown[]; itr: unknown[] };
  contracts: unknown[];
}
interface HistoryRow {
  pc_id: string;
  series: { year: number; total_assets: number | null; source_url: string }[];
}
interface PrsDeepRow {
  pc_id: string;
  url: string;
  attendance: unknown;
  debates: unknown;
  questions: unknown;
  pmbs: unknown;
  debate_titles: unknown[];
}
interface SansadDeepRow {
  pc_id: string;
  contact: {
    emails: string[];
    phones: string[];
    address: string | null;
    socials: unknown[];
  } | null;
  committees: { name: string; role: string | null }[] | null;
}
interface PartyContactRow {
  pc_id: string;
  emails: string[];
  phones: string[];
}
interface WikiBioRow {
  pc_id: string;
  title: string;
  extract: string;
  url: string;
  license: string;
}

function mergeContact(
  sansad: SansadDeepRow['contact'] | undefined,
  party: PartyContactRow | undefined,
): { emails: string[]; phones: string[]; address: string | null; socials: unknown[] } {
  const emails = [...new Set([...(sansad?.emails ?? []), ...(party?.emails ?? [])])];
  const phones = [...new Set([...(sansad?.phones ?? []), ...(party?.phones ?? [])])];
  return { emails, phones, address: sansad?.address ?? null, socials: sansad?.socials ?? [] };
}

async function main(): Promise<void> {
  const mps = JSON.parse(await readFile(new URL('mps.json', CANON), 'utf8')) as Record<
    string,
    unknown
  >[];
  const deep = byPc(await loadRaw<MynetaDeepRow>('myneta_deep.json'));
  const history = byPc(await loadRaw<HistoryRow>('myneta_history.json'));
  const prs = byPc(await loadRaw<PrsDeepRow>('prs_deep.json'));
  const sansad = byPc(await loadRaw<SansadDeepRow>('sansad_deep.json'));
  const party = byPc(await loadRaw<PartyContactRow>('party_contact.json'));
  const wiki = byPc(await loadRaw<WikiBioRow>('wikipedia.json'));

  const cov = { deep: 0, history: 0, prs: 0, contact: 0, bio: 0, history3: 0 };
  for (const mp of mps) {
    const pc = mp.pc_id as string;
    const d = deep.get(pc);
    const h = history.get(pc);
    const p = prs.get(pc);
    const s = sansad.get(pc);
    const w = wiki.get(pc);

    mp.criminal_detail = d
      ? {
          count: d.criminal.count,
          ipc_summary: d.criminal.ipc_summary,
          pending: d.criminal.pending,
          convicted: d.criminal.convicted,
        }
      : null;
    mp.assets_breakdown = d ? d.assets : null;
    mp.liabilities_detail = d ? d.liabilities : null;
    mp.income = d ? d.income : null;
    mp.contracts = d ? d.contracts : [];

    const series =
      h?.series && h.series.length
        ? h.series
        : mp.total_assets != null
          ? [{ year: 2024, total_assets: mp.total_assets as number, source_url: MYNETA_2024 }]
          : [];
    mp.assets_history = series;

    mp.prs_detail = p
      ? {
          url: p.url,
          attendance: p.attendance,
          debates: p.debates,
          questions: p.questions,
          pmbs: p.pmbs,
          debate_titles: p.debate_titles,
        }
      : null;

    mp.contact = mergeContact(s?.contact ?? undefined, party.get(pc));
    mp.committees = s?.committees ?? null;
    mp.bio = w ? { text: w.extract, url: w.url, license: w.license, title: w.title } : null;

    // hoisted scalars (sorting / cards / inferences)
    const pending = d?.criminal.pending ?? [];
    const convicted = d?.criminal.convicted ?? [];
    mp.pending_cases = d ? pending.length : null;
    mp.convicted_cases = d ? convicted.length : null;
    mp.charges_framed_count = d
      ? pending.filter((c) => c.charges_framed).length + convicted.length
      : null;
    mp.assets_latest = series.length
      ? series[series.length - 1].total_assets
      : (mp.total_assets ?? null);
    mp.assets_earliest_year = series.length ? series[0].year : null;
    mp.assets_history_pct =
      series.length >= 2 && series[0].total_assets && series[series.length - 1].total_assets
        ? Math.round(
            (((series[series.length - 1].total_assets as number) -
              (series[0].total_assets as number)) /
              (series[0].total_assets as number)) *
              100,
          )
        : null;

    if (d) cov.deep++;
    if (h?.series.length) cov.history++;
    if (h && h.series.length >= 3) cov.history3++;
    if (p) cov.prs++;
    if (
      mp.contact &&
      ((mp.contact as { emails: string[] }).emails.length ||
        (mp.contact as { phones: string[] }).phones.length)
    )
      cov.contact++;
    if (w) cov.bio++;
  }

  await writeFile(new URL('mps.json', CANON), JSON.stringify(mps, null, 2));
  console.log(
    `Merged deep sources into ${mps.length} MPs — myneta_deep ${cov.deep} · wealth-history ${cov.history} (3-point ${cov.history3}) · prs ${cov.prs} · contact ${cov.contact} · bio ${cov.bio}`,
  );
  console.log('Wrote data/canonical/mps.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
