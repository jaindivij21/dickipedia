// Pipeline step 9: portrait coverage. Resolves a hotlink photo URL per ECI constituency (pc_id) from
// in-registry sources (PRS mptrack, MyNeta candidate pages) and, only for any residual gap, the party
// sites (INC, BJP). Hotlink URLs only — non-open portraits are never re-hosted (Invariant 6). Output is
// keyed by pc_id so 10_canonical does a clean exact lookup (sansad -> prs -> myneta -> inc -> bjp).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { fetchText, sleep } from './lib/http.ts';
import { looseConstituency, normState, tokenSortRatio } from './lib/text.ts';
import type { EciSpineRow, Provenance } from './lib/types.ts';

const RAW = new URL('../data/raw/', import.meta.url);

const PRS_ORIGIN = 'https://prsindia.org';
const PRS_PAGE = (p: number): string => `${PRS_ORIGIN}/mptrack?page=${p}&per-page=9`;
const PRS_MAX_PAGES = 80;
const PRS_SLEEP_MS = 600;
const MN_CANDIDATE = (id: number): string =>
  `https://myneta.info/LokSabha2024/candidate.php?candidate_id=${id}`;
const MN_SLEEP_MS = 1100;
const INC_ORIGIN = 'https://inc.in';
const INC_PAGE = (p: number): string => `${INC_ORIGIN}/lok-sabha-members?page=${p}`;
const INC_MAX_PAGES = 12;
const INC_SLEEP_MS = 500;
const BJP_ORIGIN = 'https://www.bjp.org';
const BJP_URL = `${BJP_ORIGIN}/lok-sabha-members`;

const CONST_FUZZY = 90;
const NAME_FUZZY = 80;

interface SpineMatch {
  state?: string;
  constituency_norm: string;
  name?: string;
}
interface PrsRow extends SpineMatch {
  photo: string;
  profile_url: string;
}
interface SansadRow extends SpineMatch {
  photo_hotlink?: string;
}
interface MynetaRow extends SpineMatch {
  candidate_id: number;
}
interface PcPhoto {
  prs?: string;
  myneta?: string;
  inc?: string;
  bjp?: string;
}

const load = async <T>(f: string): Promise<T> =>
  JSON.parse(await readFile(new URL(f, RAW), 'utf8')) as T;
const abs = (origin: string, src: string): string =>
  src.startsWith('http') ? src : `${origin}${src}`;
const push = <T>(m: Map<string, T[]>, k: string, v: T): void => {
  (m.get(k) ?? m.set(k, []).get(k)!).push(v);
};

// index by state+loose-constituency and by loose-constituency alone (sources without a clean state)
function buildIdx<T extends SpineMatch>(rows: T[]): { sc: Map<string, T[]>; c: Map<string, T[]> } {
  const sc = new Map<string, T[]>(),
    c = new Map<string, T[]>();
  for (const r of rows) {
    const lc = looseConstituency(r.constituency_norm);
    push(sc, `${normState(r.state ?? '')}|${lc}`, r);
    push(c, lc, r);
  }
  return { sc, c };
}
// resolve one spine row against an index: state+constituency, then constituency, then fuzzy; name-confirm
function resolve<T extends SpineMatch>(
  s: EciSpineRow,
  idx: { sc: Map<string, T[]>; c: Map<string, T[]> },
): T | null {
  const lc = looseConstituency(s.pc_name_norm);
  let cands = idx.sc.get(`${normState(s.eci_state)}|${lc}`) ?? [];
  if (!cands.length) cands = idx.c.get(lc) ?? [];
  if (!cands.length)
    for (const [cn, rows] of idx.c)
      if (tokenSortRatio(cn, lc) >= CONST_FUZZY) {
        cands = rows;
        break;
      }
  if (!cands.length) return null;
  let best: T | null = null,
    bc = -1;
  for (const cand of cands) {
    const sc = tokenSortRatio(s.winner_name, cand.name ?? '');
    if (sc > bc) {
      bc = sc;
      best = cand;
    }
  }
  return best;
}

async function scrapePrs(): Promise<PrsRow[]> {
  const seen = new Set<string>();
  const out: PrsRow[] = [];
  for (let p = 1; p <= PRS_MAX_PAGES; p++) {
    const $ = cheerio.load(await fetchText(PRS_PAGE(p)));
    const rows = $('.views-row');
    if (!rows.length) break;
    let added = 0;
    rows.each((_, el) => {
      const card = $(el);
      const href = card.find('.views-field-field-image a').first().attr('href');
      const src = card.find('.views-field-field-image img').first().attr('src');
      const name = card.find('.views-field-title-field h3 a').first().text().trim();
      const state = card
        .find('.views-field-field-net-revenue-railway .field-content')
        .first()
        .text()
        .trim();
      const constituency = card.find('.views-field-php .field-content').first().text().trim();
      if (!href || !src || !name || seen.has(href)) return;
      seen.add(href);
      added++;
      out.push({
        name,
        constituency_norm: looseConstituency(constituency),
        state,
        photo: abs(PRS_ORIGIN, src),
        profile_url: abs(PRS_ORIGIN, href),
      });
    });
    if (!added) break;
    await sleep(PRS_SLEEP_MS);
  }
  return out;
}

const mynetaPhoto = (html: string): string | null =>
  cheerio.load(html)("img[src*='images_candidate/LokSabha2024/']").first().attr('src') ?? null;

// INC listing carries name + constituency but no portrait; the photo (when present) lives on the
// per-member profile page. Best-effort, targeted at the residual gap only.
async function scrapeInc(targets: EciSpineRow[]): Promise<{ pc_id: string; photo: string }[]> {
  if (!targets.length) return [];
  const profiles: { name: string; href: string }[] = [];
  try {
    for (let p = 0; p < INC_MAX_PAGES; p++) {
      const $ = cheerio.load(await fetchText(INC_PAGE(p)));
      const before = profiles.length;
      $("a[href*='/lok-sabha-member']").each((_, a) => {
        const href = $(a).attr('href');
        const name = $(a).text().trim();
        if (href && name && !/lok-sabha-members/.test(href)) profiles.push({ name, href });
      });
      if (profiles.length === before) break;
      await sleep(INC_SLEEP_MS);
    }
  } catch {
    return [];
  }
  const out: { pc_id: string; photo: string }[] = [];
  for (const s of targets) {
    let best: { name: string; href: string } | null = null,
      bc = -1;
    for (const pr of profiles) {
      const sc = tokenSortRatio(s.winner_name, pr.name);
      if (sc > bc) {
        bc = sc;
        best = pr;
      }
    }
    if (!best || bc < NAME_FUZZY) continue;
    try {
      const $ = cheerio.load(await fetchText(abs(INC_ORIGIN, best.href)));
      await sleep(INC_SLEEP_MS);
      const src = $('article img, .member-photo img, img[src*="/sites/"]').first().attr('src');
      if (src) out.push({ pc_id: s.pc_id, photo: abs(INC_ORIGIN, src) });
    } catch {
      continue;
    }
  }
  return out;
}

// BJP listing blocks simple fetches; best-effort, never fatal.
async function scrapeBjp(targets: EciSpineRow[]): Promise<{ pc_id: string; photo: string }[]> {
  if (!targets.length) return [];
  try {
    const $ = cheerio.load(await fetchText(BJP_URL));
    const cards: { name: string; src: string }[] = [];
    $('img').each((_, img) => {
      const src = $(img).attr('src');
      const name = ($(img).attr('alt') || '').trim();
      if (src && name) cards.push({ name, src });
    });
    const out: { pc_id: string; photo: string }[] = [];
    for (const s of targets) {
      let best: { name: string; src: string } | null = null,
        bc = -1;
      for (const c of cards) {
        const sc = tokenSortRatio(s.winner_name, c.name);
        if (sc > bc) {
          bc = sc;
          best = c;
        }
      }
      if (best && bc >= NAME_FUZZY) out.push({ pc_id: s.pc_id, photo: abs(BJP_ORIGIN, best.src) });
    }
    return out;
  } catch {
    return [];
  }
}

async function main(): Promise<void> {
  const spine = await load<EciSpineRow[]>('eci_spine.json');
  const sansad = await load<SansadRow[]>('sansad_18th.json');
  const myneta = await load<MynetaRow[]>('myneta_2024.json');

  const sansadIdx = buildIdx(sansad);
  const sansadGap = spine.filter((s) => {
    const m = resolve(s, sansadIdx);
    return !(m && m.photo_hotlink);
  });
  console.log(`Sansad portrait gap: ${sansadGap.length}`);

  console.log('Scraping PRS mptrack (paginated)...');
  const prs = await scrapePrs();
  const prsIdx = buildIdx(prs);
  console.log(`  PRS photos: ${prs.length}`);

  const byPcId: Record<string, PcPhoto> = {};
  for (const s of spine) {
    const m = resolve(s, prsIdx);
    if (m) (byPcId[s.pc_id] ??= {}).prs = m.photo;
  }

  // MyNeta backstop for the sansad gap (candidate ids already resolved by step 08)
  const mynetaIdx = buildIdx(myneta);
  const mnTargets = sansadGap
    .map((s) => ({ s, m: resolve(s, mynetaIdx) }))
    .filter((x): x is { s: EciSpineRow; m: MynetaRow } => Boolean(x.m?.candidate_id));
  console.log(`Fetching MyNeta candidate photos for ${mnTargets.length} gap MPs...`);
  let mnCount = 0;
  for (const { s, m } of mnTargets) {
    const photo = mynetaPhoto(await fetchText(MN_CANDIDATE(m.candidate_id)));
    await sleep(MN_SLEEP_MS);
    if (photo) {
      (byPcId[s.pc_id] ??= {}).myneta = photo;
      mnCount++;
    }
  }
  console.log(`  MyNeta photos: ${mnCount}`);

  // residual gap after sansad + PRS + MyNeta → only then attempt the party sites
  const residual = sansadGap.filter((s) => !byPcId[s.pc_id]?.prs && !byPcId[s.pc_id]?.myneta);
  console.log(`Residual gap after in-registry trio: ${residual.length}`);
  const inc = await scrapeInc(residual);
  const bjp = await scrapeBjp(residual);
  for (const r of inc) (byPcId[r.pc_id] ??= {}).inc = r.photo;
  for (const r of bjp) (byPcId[r.pc_id] ??= {}).bjp = r.photo;
  console.log(`  INC photos: ${inc.length} · BJP photos: ${bjp.length}`);

  const stillUncovered = residual.filter((s) => !byPcId[s.pc_id]?.inc && !byPcId[s.pc_id]?.bjp);
  if (stillUncovered.length)
    console.log(
      `  Still uncovered: ${stillUncovered.map((s) => `${s.winner_name} (${s.pc_name})`).join(', ')}`,
    );

  const prov: Record<string, Provenance> = {
    prs: {
      source: 'PRS Legislative Research (mptrack)',
      license: 'Photo hotlinked under PRS terms; not re-hosted',
      url: `${PRS_ORIGIN}/mptrack`,
    },
    myneta: {
      source: 'ADR / MyNeta.info (from ECI affidavits)',
      license: 'Non-commercial; display + attribution; photo hotlinked, not re-hosted',
      url: 'https://myneta.info/LokSabha2024/',
    },
    inc: {
      source: 'Indian National Congress (inc.in)',
      license: 'Photo hotlinked under publisher terms; not re-hosted',
      url: `${INC_ORIGIN}/lok-sabha-members`,
    },
    bjp: {
      source: 'Bharatiya Janata Party (bjp.org)',
      license: 'Photo hotlinked under publisher terms; not re-hosted',
      url: BJP_URL,
    },
  };

  await mkdir(RAW, { recursive: true });
  await writeFile(
    new URL('photos.json', RAW),
    JSON.stringify(
      {
        by_pc_id: byPcId,
        _provenance: prov,
        _meta: { prs: prs.length, myneta: mnCount, inc: inc.length, bjp: bjp.length },
      },
      null,
      2,
    ),
  );
  console.log(
    `Wrote data/raw/photos.json (${Object.keys(byPcId).length} constituencies with a fallback photo)`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
