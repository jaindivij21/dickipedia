import { mkdir, writeFile, readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { fetchText, fetchTextOrNull, sleep } from './lib/http.ts';
import { looseConstituency, normState, tokenSortRatio } from './lib/text.ts';
import type { EciSpineRow, Provenance } from './lib/types.ts';

const RAW = new URL('../data/raw/', import.meta.url);
const ORIGIN = 'https://prsindia.org';
const LISTING = (p: number): string => `${ORIGIN}/mptrack?page=${p}&per-page=9`;
const MAX_PAGES = 80;
const LIST_SLEEP_MS = 500;
const DETAIL_SLEEP_MS = 500;
const CONST_FUZZY = 90;
const FLUSH_EVERY = 40;
const PROVENANCE: Provenance = {
  source: 'PRS Legislative Research (mptrack)',
  license: 'Facts + deeplink; ODbL-aligned open civic data',
  url: `${ORIGIN}/mptrack`,
};

interface ListingRow {
  name: string;
  constituency_norm: string;
  state: string;
  url: string;
}
interface Metric {
  value: number | null;
  national_avg: number | null;
  state_avg: number | null;
}
interface DebateTitle {
  date: string | null;
  title: string;
  type: string | null;
}
interface PrsDeepRow {
  pc_id: string;
  url: string;
  attendance: Metric & { sessions: { session: string; pct: number | null }[] };
  debates: Metric;
  questions: Metric;
  pmbs: Metric;
  debate_titles: DebateTitle[];
  _provenance: Provenance;
}

const abs = (href: string): string => (href.startsWith('http') ? href : `${ORIGIN}${href}`);
const clean = (s: string): string =>
  s
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const num = (s: string | undefined): number | null => {
  if (s == null) return null;
  const m = s.match(/-?\d[\d,]*\.?\d*/);
  return m ? Number(m[0].replace(/,/g, '')) : null;
};

async function scrapeListing(): Promise<ListingRow[]> {
  const seen = new Set<string>();
  const out: ListingRow[] = [];
  for (let p = 1; p <= MAX_PAGES; p++) {
    const $ = cheerio.load(await fetchText(LISTING(p)));
    const cards = $('.views-row');
    if (!cards.length) break;
    let added = 0;
    cards.each((_, el) => {
      const card = $(el);
      const href = card.find('.views-field-field-image a').first().attr('href');
      const name = card.find('.views-field-title-field h3 a').first().text().trim();
      const state = card
        .find('.views-field-field-net-revenue-railway .field-content')
        .first()
        .text()
        .trim();
      const constituency = card.find('.views-field-php .field-content').first().text().trim();
      if (!href || !name || seen.has(href)) return;
      seen.add(href);
      added++;
      out.push({ name, constituency_norm: looseConstituency(constituency), state, url: abs(href) });
    });
    if (!added) break;
    await sleep(LIST_SLEEP_MS);
  }
  return out;
}

function resolveSlug(s: EciSpineRow, idx: Map<string, ListingRow[]>): ListingRow | null {
  const lc = looseConstituency(s.pc_name_norm);
  let cands = idx.get(`${normState(s.eci_state)}|${lc}`) ?? idx.get(`|${lc}`) ?? [];
  if (!cands.length)
    for (const [k, rows] of idx)
      if (tokenSortRatio(k.split('|')[1] ?? '', lc) >= CONST_FUZZY) {
        cands = rows;
        break;
      }
  if (!cands.length) return null;
  let best: ListingRow | null = null,
    bc = -1;
  for (const c of cands) {
    const sc = tokenSortRatio(s.winner_name, c.name);
    if (sc > bc) {
      bc = sc;
      best = c;
    }
  }
  return best;
}

function cardValue($: CheerioAPI, cls: string): number | null {
  const block = $(`.${cls}`).first();
  if (!block.length) return null;
  const m = clean(block.text()).match(/Selected MP\s*(-?\d[\d,]*\.?\d*)/i);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

const fieldNum = ($: CheerioAPI, fieldName: string): number | null =>
  num(clean($(`.field-name-${fieldName} .field-item`).first().text()));

function debateTitles($: CheerioAPI): DebateTitle[] {
  const table = $('table')
    .filter((_, t) => /Debate title|Bill name/i.test($(t).text()))
    .first();
  const out: DebateTitle[] = [];
  table.find('tr').each((i, tr) => {
    const tds = $(tr).find('td');
    if (i === 0 || tds.length < 2) return;
    const date = clean($(tds[0]).text()) || null;
    const title = clean($(tds[1]).text());
    const type = tds.length > 2 ? clean($(tds[2]).text()) || null : null;
    if (title) out.push({ date, title, type });
  });
  return out;
}

function parseDetail(html: string, pc_id: string, url: string): PrsDeepRow {
  const $ = cheerio.load(html);
  const participated = clean($.root().text()).match(/Participated in\s*(\d+)\s*Debates/i);
  return {
    pc_id,
    url,
    attendance: {
      value: cardValue($, 'mp-attendance'),
      national_avg: fieldNum($, 'field-national-attendance'),
      state_avg: fieldNum($, 'field-state-attendance'),
      sessions: [],
    },
    debates: {
      value: participated ? Number(participated[1]) : cardValue($, 'mp-debate'),
      national_avg: fieldNum($, 'field-national-debate'),
      state_avg: fieldNum($, 'field-state-debate'),
    },
    questions: {
      value: cardValue($, 'mp-questions'),
      national_avg: fieldNum($, 'field-national-questions'),
      state_avg: fieldNum($, 'field-state-questions'),
    },
    pmbs: {
      value: cardValue($, 'mp-pmb'),
      national_avg: fieldNum($, 'field-national-pmb'),
      state_avg: fieldNum($, 'field-state-pmb'),
    },
    debate_titles: debateTitles($),
    _provenance: PROVENANCE,
  };
}

async function main(): Promise<void> {
  const spine = JSON.parse(await readFile(new URL('eci_spine.json', RAW), 'utf8')) as EciSpineRow[];
  console.log('Scraping PRS mptrack listing for profile slugs...');
  const listing = await scrapeListing();
  const idx = new Map<string, ListingRow[]>();
  for (const r of listing) {
    for (const k of [`${normState(r.state)}|${r.constituency_norm}`, `|${r.constituency_norm}`])
      (idx.get(k) ?? idx.set(k, []).get(k)!).push(r);
  }
  console.log(`  listing rows: ${listing.length}`);

  const resolved = spine
    .map((s) => ({ s, row: resolveSlug(s, idx) }))
    .filter((x): x is { s: EciSpineRow; row: ListingRow } => Boolean(x.row));
  console.log(`Resolved PRS profiles: ${resolved.length}/${spine.length}`);

  await mkdir(RAW, { recursive: true });
  const out: PrsDeepRow[] = [];
  let i = 0;
  for (const { s, row } of resolved) {
    const html = await fetchTextOrNull(row.url);
    await sleep(DETAIL_SLEEP_MS);
    if (!html) continue;
    out.push(parseDetail(html, s.pc_id, row.url));
    if (++i % FLUSH_EVERY === 0) {
      await writeFile(new URL('prs_deep.json', RAW), JSON.stringify(out, null, 2));
      console.log(`  ${i}/${resolved.length} parsed`);
    }
  }
  await writeFile(new URL('prs_deep.json', RAW), JSON.stringify(out, null, 2));
  const withDebates = out.filter((r) => r.debate_titles.length > 0).length;
  console.log(`PRS deep parsed: ${out.length} (with debate titles ${withDebates})`);
  console.log('Wrote data/raw/prs_deep.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
