// Pipeline step 15: leader bios from English Wikipedia (the one descriptive, non-registry source —
// attributed CC BY-SA, excluded from scoring). Resolve each MP to a page via opensearch, disambiguate by
// politics / state / party tokens + name similarity, then take the REST summary's one-paragraph extract.
// Below a confidence floor we emit nothing (a wrong bio is worse than none). Also writes a crosswalk_wiki
// overlay (pc_id -> title) merged later by 17_merge.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fetchJsonOrNull, sleep } from './lib/http.ts';
import { tokenSortRatio } from './lib/text.ts';
import type { Provenance } from './lib/types.ts';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
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
const POLITICS_RE =
  /lok sabha|member of parliament|\bpolitician\b|minister|\bmla\b|legislative|indian national congress|bharatiya janata/i;
const PROVENANCE: Provenance = {
  source: 'Wikipedia (English)',
  license: 'CC BY-SA 4.0',
  url: 'https://en.wikipedia.org/',
};

interface CrosswalkRow {
  pc_id: string;
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
  if (!sum.title || sum.type === 'disambiguation' || (sum.extract ?? '').length < 40) return 0;
  const nameSim = tokenSortRatio(s.winner, titleBase(sum.title));
  const haystack = `${sum.extract ?? ''} ${sum.description ?? ''}`;
  const ctx = `${s.eci_state} ${s.winner_party} ${s.winner_party_full}`;
  const politics =
    POLITICS_RE.test(haystack) ||
    ctx.split(/\s+/).some((w) => w.length > 3 && new RegExp(w, 'i').test(haystack));
  if (nameSim < NAME_FLOOR) return 0;
  if (!politics && nameSim < NAME_FLOOR_NO_POLITICS) return 0;
  return nameSim + (politics ? POLITICS_BONUS : 0);
}

async function resolve(s: CrosswalkRow): Promise<WikiBioRow | null> {
  const search = await fetchJsonOrNull<SearchResponse>(
    SEARCH(`${s.winner} ${s.winner_party_full} ${s.eci_state} politician`),
  );
  await sleep(SLEEP_MS);
  const titles = (search?.query?.search ?? []).map((h) => h.title).slice(0, 4);
  if (!titles.length) {
    const fb = await fetchJsonOrNull<SearchResponse>(SEARCH(`${s.winner} politician`));
    await sleep(SLEEP_MS);
    titles.push(...(fb?.query?.search ?? []).map((h) => h.title).slice(0, 3));
  }
  let best: WikiBioRow | null = null;
  for (const title of titles) {
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

async function main(): Promise<void> {
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
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
