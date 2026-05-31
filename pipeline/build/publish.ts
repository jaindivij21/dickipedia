import { writeFile, readFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { CANON, RAW } from '../lib/paths.ts';
import { cohortCaps, type ScoreInput } from '../lib/score.ts';

const MP_DIR = new URL('mp/', CANON);

const SCHEMA_VERSION = 1;

type Json = Record<string, unknown>;
const asNum = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const asStr = (v: unknown): string => (typeof v === 'string' ? v : '');
const asBool = (v: unknown): boolean => v === true;

const slugify = (s: string): string =>
  (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const mpSlug = (name: string, pc: string): string => `${slugify(name)}-${slugify(pc)}`;

const mean = (xs: number[]): number => Math.round(xs.reduce((s, x) => s + x, 0) / (xs.length || 1));

const sortKeys = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object')
    return Object.fromEntries(
      Object.keys(v as Json)
        .sort()
        .map((k) => [k, sortKeys((v as Json)[k])]),
    );
  return v;
};
const stable = (obj: unknown): string => `${JSON.stringify(sortKeys(obj), null, 2)}\n`;

const SOURCE_RAW: Record<string, string> = {
  eci: 'eci_spine.json',
  prs: 'prs_18th.json',
  sansad: 'sansad_18th.json',
  myneta: 'myneta_2024.json',
  mplads: 'mplads.json',
  bonds: 'electoral_bonds.json',
  wikipedia: 'wikipedia.json',
  news: 'latest_news.json',
};
const FIXED_AS_OF: Record<string, string> = {
  eci: '2024-06-04',
  myneta: '2024-05-01',
  bonds: '2024-02-15',
};
const SECTION_SRC: Record<string, string> = {
  election: 'eci',
  work: 'prs',
  wealth: 'myneta',
  mplads: 'mplads',
  contact: 'sansad',
  bio: 'wikipedia',
  news: 'news',
};

async function sourceAsOf(
  key: string,
  fetched: Record<string, string>,
  fallback: string,
): Promise<string> {
  if (FIXED_AS_OF[key]) return FIXED_AS_OF[key];
  if (fetched[key]) return fetched[key].slice(0, 10);
  const rawName = SOURCE_RAW[key];
  if (rawName && existsSync(new URL(rawName, RAW))) {
    try {
      return (await stat(new URL(rawName, RAW))).mtime.toISOString().slice(0, 10);
    } catch {
      /* fall through */
    }
  }
  return fallback;
}

export async function run(): Promise<void> {
  const mps = JSON.parse(await readFile(new URL('mps.json', CANON), 'utf8')) as Json[];
  const parties = JSON.parse(await readFile(new URL('parties.json', CANON), 'utf8')) as Json[];
  const symbolByCode = new Map(parties.map((p) => [asStr(p.code), p.symbol ?? null]));

  await mkdir(MP_DIR, { recursive: true });

  const slugById = new Map<string, string>();
  for (const m of mps) {
    const slug = mpSlug(asStr(m.mp_name), asStr(m.pc_name));
    const clash = slugById.get(slug);
    if (clash) throw new Error(`slug collision "${slug}": ${clash} vs ${asStr(m.pc_id)}`);
    slugById.set(slug, asStr(m.pc_id));
  }

  const slim = mps
    .map((m) => ({
      slug: mpSlug(asStr(m.mp_name), asStr(m.pc_name)),
      name: asStr(m.mp_name),
      pc: asStr(m.pc_name),
      state: asStr(m.eci_state),
      party: asStr(m.party),
      party_full: asStr(m.party_full),
      score: asNum(m.accountability_score),
      photo: typeof m.photo_hotlink === 'string' ? m.photo_hotlink : null,
      symbol: (symbolByCode.get(asStr(m.party)) ?? null) as string | null,
      attendance: asNum(m.attendance_pct),
      criminal: asNum(m.criminal_cases),
      mplads_util: asNum(m.mplads_utilisation_pct),
      nota_gt_margin: asBool(m.nota_gt_margin),
      assets: asNum(m.total_assets),
      minister: typeof m.minister === 'boolean' ? (m.minister as boolean) : null,
      pc_id: asStr(m.pc_id),
      mplads_unspent: asNum(m.mplads_unspent),
    }))
    .sort((a, b) => a.pc_id.localeCompare(b.pc_id));

  const nonMinAtt = mps.filter((m) => m.minister !== true && asNum(m.attendance_pct) != null);
  const crimDenom = mps.filter((m) => asNum(m.criminal_cases) != null).length || 1;
  const withCrim = mps.filter((m) => (asNum(m.criminal_cases) ?? 0) > 0).length;
  const featured =
    mps
      .filter(
        (m) =>
          asNum(m.accountability_score) != null &&
          m.photo_hotlink &&
          (asNum(m.criminal_cases) ?? 0) > 0,
      )
      .sort(
        (a, b) => (asNum(a.accountability_score) ?? 0) - (asNum(b.accountability_score) ?? 0),
      )[0] ?? mps[0];
  const scores = mps
    .map((m) => asNum(m.accountability_score))
    .filter((x): x is number => x != null)
    .sort((a, b) => a - b);
  const inBand = (lo: number, hi: number): number => scores.filter((s) => s >= lo && s < hi).length;

  const statesList = [...new Set(mps.map((m) => asStr(m.eci_state)))].filter(Boolean).sort();
  const partiesList = [...new Set(mps.map((m) => asStr(m.party)))]
    .filter(Boolean)
    .sort(
      (a, b) =>
        mps.filter((m) => asStr(m.party) === b).length -
        mps.filter((m) => asStr(m.party) === a).length,
    );

  const aggregates = {
    avg_attendance: mean(nonMinAtt.map((m) => asNum(m.attendance_pct) ?? 0)),
    avg_questions: mean(nonMinAtt.map((m) => asNum(m.questions) ?? 0)),
    avg_debates: mean(nonMinAtt.map((m) => asNum(m.debates) ?? 0)),
    avg_util: mean(
      mps.map((m) => asNum(m.mplads_utilisation_pct)).filter((x): x is number => x != null),
    ),
    criminal_pct: Math.round((withCrim / crimDenom) * 100),
    nota_seats: mps.filter((m) => asBool(m.nota_gt_margin)).length,
    zero_questions: mps.filter((m) => asNum(m.questions) === 0).length,
    total: mps.length,
    featured_slug: mpSlug(asStr(featured.mp_name), asStr(featured.pc_name)),
    cohort_caps: cohortCaps(mps as unknown as ScoreInput[]),
    score_bins: {
      poor: inBand(0, 30),
      mediocre: inBand(30, 55),
      decent: inBand(55, 75),
      strong: inBand(75, 101),
    },
  };

  const index = {
    schema_version: SCHEMA_VERSION,
    mps: slim,
    aggregates,
    facets: { states: statesList, parties: partiesList },
  };

  let fetched: Record<string, string> = {};
  if (existsSync(new URL('_fetched.json', RAW)))
    fetched = JSON.parse(await readFile(new URL('_fetched.json', RAW), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const sources: Record<string, { as_of: string }> = {};
  for (const key of Object.keys(SOURCE_RAW))
    sources[key] = { as_of: await sourceAsOf(key, fetched, today) };
  const generated_at = Object.values(sources)
    .map((s) => s.as_of)
    .sort()
    .at(-1) as string;
  const sections: Record<string, { source: string; as_of: string }> = {};
  for (const [section, src] of Object.entries(SECTION_SRC))
    sections[section] = { source: src, as_of: sources[src]?.as_of ?? generated_at };
  const manifest = { schema_version: SCHEMA_VERSION, generated_at, sources, sections };

  for (const m of mps)
    await writeFile(
      new URL(`${mpSlug(asStr(m.mp_name), asStr(m.pc_name))}.json`, MP_DIR),
      stable(m),
    );

  const want = new Set(slugById.keys());
  for (const f of await readdir(MP_DIR))
    if (f.endsWith('.json') && !want.has(f.slice(0, -5))) await rm(new URL(f, MP_DIR));

  await writeFile(new URL('index.json', CANON), stable(index));
  await writeFile(new URL('manifest.json', CANON), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    `Published ${mps.length} MP files · index (${slim.length} slim) · manifest as_of ${generated_at} · bands P${aggregates.score_bins.poor}/M${aggregates.score_bins.mediocre}/D${aggregates.score_bins.decent}/S${aggregates.score_bins.strong}`,
  );
}
