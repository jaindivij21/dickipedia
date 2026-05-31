import { writeFile, readFile } from 'node:fs/promises';
import { isSeriousCase } from './lib/serious.ts';
import { hasAccusatoryPhrasing } from './lib/text.ts';
import { cohortCaps, scoreMp, type ScoreInput } from './lib/score.ts';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
const CURATED = new URL('../data/curated/', import.meta.url);
const MYNETA_2024 = 'https://myneta.info/LokSabha2024/';
const RESPONSES = new Set(['positive', 'neutral', 'negative', 'divided']);
const SUPERLATIVE = /\b(greatest|biggest|historic|landmark|visionary|iconic)\b/i;

const loadFrom = async <T>(base: URL, f: string): Promise<T[]> => {
  try {
    return JSON.parse(await readFile(new URL(f, base), 'utf8')) as T[];
  } catch {
    return [];
  }
};
const loadRaw = <T>(f: string): Promise<T[]> => loadFrom<T>(RAW, f);
const byPc = <T extends { pc_id: string }>(rows: T[]): Map<string, T> =>
  new Map(rows.map((r) => [r.pc_id, r]));

interface CriminalCaseRaw {
  sections: string[];
  charges_framed: boolean;
}
interface MynetaDeepRow {
  pc_id: string;
  criminal: {
    count: number;
    ipc_summary: unknown[];
    pending: CriminalCaseRaw[];
    convicted: CriminalCaseRaw[];
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
interface NewsRow {
  pc_id: string;
  articles: { title: string; publisher: string; url: string; date: string; flagged: boolean }[];
}
interface SeriousRow {
  pc_id: string;
}
interface PressRow {
  pc_id: string;
  flag_label: string;
  statement: string;
  as_of: string;
  sources: { publisher: string; title: string; url: string; date: string | null }[];
}
interface RecordRow {
  pc_id: string;
  office: string;
  entries: {
    title: string;
    detail?: string;
    response?: string | null;
    sources: PressRow['sources'];
  }[];
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
  const news = byPc(await loadRaw<NewsRow>('latest_news.json'));
  const mynetaSerious = new Set(
    (await loadRaw<SeriousRow>('myneta_serious.json')).map((r) => r.pc_id),
  );
  const press = byPc(await loadFrom<PressRow>(CURATED, 'press_accountability.json'));
  const records = byPc(await loadFrom<RecordRow>(CURATED, 'achievements.json'));

  const cov = {
    deep: 0,
    history: 0,
    prs: 0,
    contact: 0,
    bio: 0,
    history3: 0,
    news: 0,
    press: 0,
    record: 0,
  };
  let seriousFromCases = 0;
  let mynetaOnly = 0;
  let derivedOnly = 0;
  for (const mp of mps) {
    const pc = mp.pc_id as string;
    const d = deep.get(pc);
    const h = history.get(pc);
    const p = prs.get(pc);
    const s = sansad.get(pc);
    const w = wiki.get(pc);

    const withSerious = <T extends CriminalCaseRaw>(c: T): T & { serious: boolean } => ({
      ...c,
      serious: isSeriousCase(c.sections),
    });
    const pendingCases = d ? d.criminal.pending.map(withSerious) : [];
    const convictedCases = d ? d.criminal.convicted.map(withSerious) : [];
    mp.criminal_detail = d
      ? {
          count: d.criminal.count,
          ipc_summary: d.criminal.ipc_summary,
          pending: pendingCases,
          convicted: convictedCases,
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
    mp.news = news.get(pc)?.articles ?? [];
    const pr = press.get(pc);
    mp.press_accountability = pr
      ? { flag_label: pr.flag_label, statement: pr.statement, as_of: pr.as_of, sources: pr.sources }
      : null;
    const rec = records.get(pc);
    if (rec) {
      for (const e of rec.entries) {
        if (e.response != null && !RESPONSES.has(e.response))
          throw new Error(`notable_record: invalid response "${e.response}" for ${pc}`);
        const text = `${e.title} ${e.detail ?? ''}`;
        if (hasAccusatoryPhrasing(text) || SUPERLATIVE.test(text))
          throw new Error(`notable_record: non-neutral phrasing for ${pc}: "${e.title}"`);
      }
    }
    mp.notable_record = rec ? { office: rec.office, entries: rec.entries } : null;

    mp.pending_cases = d ? pendingCases.length : null;
    mp.convicted_cases = d ? convictedCases.length : null;
    mp.charges_framed_count = d
      ? pendingCases.filter((c) => c.charges_framed).length + convictedCases.length
      : null;
    const seriousCount =
      pendingCases.filter((c) => c.serious).length + convictedCases.filter((c) => c.serious).length;
    mp.serious_cases = d ? seriousCount : null;
    mp.non_serious_cases = d ? pendingCases.length + convictedCases.length - seriousCount : null;
    const listedSerious = mynetaSerious.has(pc);
    mp.myneta_serious = listedSerious ? true : mp.criminal_cases != null ? false : null;
    if (d && seriousCount > 0) seriousFromCases++;
    if (d && listedSerious && seriousCount === 0) mynetaOnly++;
    if (d && !listedSerious && seriousCount > 0) derivedOnly++;
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
    if ((mp.news as unknown[]).length) cov.news++;
    if (mp.press_accountability) cov.press++;
    if (mp.notable_record) cov.record++;
  }

  const caps = cohortCaps(mps as unknown as ScoreInput[]);
  for (const mp of mps) {
    const { score, breakdown } = scoreMp(mp as unknown as ScoreInput, caps);
    mp.accountability_score = score;
    mp.score_breakdown = breakdown;
  }
  const scores = (mps.map((m) => m.accountability_score) as number[]).sort((a, b) => a - b);
  const inBand = (lo: number, hi: number) => scores.filter((s) => s >= lo && s < hi).length;

  await writeFile(new URL('mps.json', CANON), JSON.stringify(mps, null, 2));
  console.log(
    `Merged deep sources into ${mps.length} MPs — myneta_deep ${cov.deep} · wealth-history ${cov.history} (3-point ${cov.history3}) · prs ${cov.prs} · contact ${cov.contact} · bio ${cov.bio} · news ${cov.news} · press ${cov.press} · record ${cov.record}`,
  );
  console.log(
    `Serious cases — ${mynetaSerious.size} flagged by MyNeta · ${seriousFromCases} have >=1 case citing a serious section · cross-check vs MyNeta: ${mynetaOnly} MyNeta-only, ${derivedOnly} derived-only`,
  );
  console.log(
    `Score (v2) — caps Q${caps.questions}/D${caps.debates}/util${Math.round(caps.util)}/compl${caps.completion.toFixed(2)} · min ${scores[0]} median ${scores[Math.floor(scores.length / 2)]} max ${scores[scores.length - 1]} · zeros ${scores.filter((s) => s === 0).length} · bands Poor<30 ${inBand(0, 30)} · Mediocre ${inBand(30, 55)} · Decent ${inBand(55, 75)} · Strong>=75 ${inBand(75, 101)}`,
  );
  console.log('Wrote data/canonical/mps.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
