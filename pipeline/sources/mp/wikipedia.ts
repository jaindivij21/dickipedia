import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fetchJsonOrNull, sleep } from '../../lib/http.ts';
import { tokenSortRatio } from '../../lib/text.ts';
import type { Provenance } from '../../lib/types.ts';
import { RAW, CANON } from '../../lib/paths.ts';

const SEARCH = (q: string): string =>
  `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=5&srsearch=${encodeURIComponent(q)}`;
const SUMMARY = (title: string): string =>
  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
const SLEEP_MS = 120;
const FLUSH_EVERY = 50;
const NAME_FLOOR = 55;
const NAME_FLOOR_NO_POLITICS = 80;
const POLITICS_BONUS = 25;
const ACCEPT_SCORE = 80;
const SEARCH_TOP = 4;
const MAX_CANDIDATES = 6;
const POLITICS_RE =
  /lok sabha|rajya sabha|member of parliament|\bpolitician\b|minister|\bmla\b|\bmlc\b|legislative|vidhan sabha|general election|\bconstituency\b|\belected\b|chief minister|cabinet|indian national congress|bharatiya janata/i;
const DISAMBIG_RE =
  /\bmay refer to\b|\bis (?:a|an) (?:given |male |female |unisex |common |hindu |indian )*name\b|\bcommonly refers to\b|\blist of people\b/i;
const PROVENANCE: Provenance = {
  source: 'Wikipedia (English)',
  license: 'CC BY-SA 4.0',
  url: 'https://en.wikipedia.org/',
};

interface CrosswalkRow {
  pc_id: string;
  pc_name: string;
  eci_state: string;
  winner: string;
  winner_party: string;
  winner_party_full: string;
}
interface SearchResponse {
  query?: { search?: { title: string }[] };
}
interface Summary {
  type?: string;
  title?: string;
  extract?: string;
  description?: string;
  content_urls?: { desktop?: { page?: string } };
}
interface WikiBioRow {
  pc_id: string;
  title: string;
  extract: string;
  url: string;
  license: string;
  confidence: number;
  _provenance: Provenance;
}

const titleBase = (t: string): string => t.replace(/\s*\(.*?\)\s*/g, ' ').trim();

function scoreCandidate(s: CrosswalkRow, sum: Summary): number {
  if (
    !sum.title ||
    sum.type === 'disambiguation' ||
    (sum.extract ?? '').length < 40 ||
    DISAMBIG_RE.test(sum.extract ?? '')
  )
    return 0;
  const nameSim = tokenSortRatio(s.winner, titleBase(sum.title));
  const haystack = `${sum.extract ?? ''} ${sum.description ?? ''}`;
  const hay = haystack.toLowerCase();
  const ctx = `${s.eci_state} ${s.winner_party} ${s.winner_party_full}`;
  const politics =
    POLITICS_RE.test(haystack) ||
    ctx
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ''))
      .some((w) => w.length > 3 && hay.includes(w));
  if (nameSim < NAME_FLOOR) return 0;
  if (!politics && nameSim < NAME_FLOOR_NO_POLITICS) return 0;
  return nameSim + (politics ? POLITICS_BONUS : 0);
}

async function searchTitles(q: string): Promise<string[]> {
  const res = await fetchJsonOrNull<SearchResponse>(SEARCH(q));
  await sleep(SLEEP_MS);
  return (res?.query?.search ?? []).map((h) => h.title).slice(0, SEARCH_TOP);
}

async function resolve(s: CrosswalkRow): Promise<WikiBioRow | null> {
  const queries = [
    `${s.winner} ${s.winner_party_full} ${s.eci_state} politician`,
    `${s.winner} ${s.pc_name} ${s.eci_state} member of parliament`,
    `${s.winner} politician`,
  ];
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const q of queries) {
    for (const t of await searchTitles(q)) {
      const k = t.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        titles.push(t);
      }
    }
    if (titles.length >= MAX_CANDIDATES) break;
  }
  let best: WikiBioRow | null = null;
  for (const title of titles.slice(0, MAX_CANDIDATES)) {
    const sum = await fetchJsonOrNull<Summary>(SUMMARY(title));
    await sleep(SLEEP_MS);
    if (!sum) continue;
    const score = scoreCandidate(s, sum);
    if (score >= ACCEPT_SCORE && (!best || score > best.confidence)) {
      best = {
        pc_id: s.pc_id,
        title: sum.title ?? title,
        extract: (sum.extract ?? '').trim(),
        url:
          sum.content_urls?.desktop?.page ??
          `https://en.wikipedia.org/wiki/${title.replace(/ /g, '_')}`,
        license: 'CC BY-SA 4.0',
        confidence: score,
        _provenance: PROVENANCE,
      };
    }
  }
  return best;
}

export async function run(): Promise<void> {
  const crosswalk = JSON.parse(
    await readFile(new URL('crosswalk.json', CANON), 'utf8'),
  ) as CrosswalkRow[];
  const limit = process.argv[2] ? Number(process.argv[2]) : crosswalk.length;
  const rows = crosswalk.slice(0, limit);
  console.log(`Resolving Wikipedia bios for ${rows.length} MPs...`);

  await mkdir(RAW, { recursive: true });
  const out: WikiBioRow[] = [];
  let i = 0;
  for (const s of rows) {
    const bio = await resolve(s);
    if (bio) out.push(bio);
    if (++i % FLUSH_EVERY === 0) {
      await writeFile(new URL('wikipedia.json', RAW), JSON.stringify(out, null, 2));
      console.log(`  ${i}/${crosswalk.length} · bios so far ${out.length}`);
    }
  }
  await writeFile(new URL('wikipedia.json', RAW), JSON.stringify(out, null, 2));
  await writeFile(
    new URL('crosswalk_wiki.json', RAW),
    JSON.stringify(
      out.map((b) => ({ pc_id: b.pc_id, title: b.title, confidence: b.confidence })),
      null,
      2,
    ),
  );
  console.log(`Wikipedia bios resolved: ${out.length}/${crosswalk.length}`);
  console.log('Wrote data/raw/wikipedia.json + crosswalk_wiki.json');
}
