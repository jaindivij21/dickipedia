// Pipeline step 19: per-MP press coverage from Google News RSS (keyless, India-localised). News is the one
// AGGREGATED, non-registry, score-excluded source — handled like the Wikipedia bio. We store only the
// headline + publisher + date + OUTBOUND link (never the article body; CLAUDE.md invariant 6), and flag any
// headline that carries accusatory phrasing (invariant 3) so the app hides it by default. Reads the canonical
// spine for the resolved name, fetches uncached (so re-runs refresh), throttles, and is resumable; a dead
// query returns null and is skipped rather than aborting the 543-MP crawl. Runs before 17_merge folds it in.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { fetchTextOrNull, sleep } from './lib/http.ts';
import { hasAccusatoryPhrasing, normName } from './lib/text.ts';
import type { Provenance } from './lib/types.ts';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
const SLEEP_MS = 1500;
const MAX_ITEMS = 5;
const FLUSH_EVERY = 40;
const MIN_NAME_TOKEN_LEN = 3;
const PROVENANCE: Provenance = {
  source: 'Google News (aggregator; links to third-party publishers)',
  license: 'Headline + publisher + date + outbound link only; no article body re-hosted',
  url: 'https://news.google.com/',
};

interface MpLite {
  pc_id: string;
  mp_name: string;
  pc_name: string;
}
interface NewsArticle {
  title: string;
  publisher: string;
  url: string;
  date: string;
  flagged: boolean;
}
interface NewsRow {
  pc_id: string;
  articles: NewsArticle[];
  _provenance: Provenance;
}

const cleanPc = (s: string): string => s.replace(/\s*\(.*?\)\s*/g, ' ').trim();
// Canonical names carry an honorific (520/543 are "Shri …"/"Dr. …"); no outlet writes that verbatim, so
// quoting the full honorific name throttles Google's recall to near-zero. Strip the leading honorific(s)
// and anchor on the (quoted) bare name + constituency; the namesMp filter still enforces relevance.
const HONORIFIC_PREFIX =
  /^\s*(shri|shrimati|smt|dr|kumari|km|prof|adv|mr|mrs|ms|md|haji|maulana|col|gen|capt)\.?\s+/i;
const queryName = (name: string): string => {
  let s = name;
  while (HONORIFIC_PREFIX.test(s)) s = s.replace(HONORIFIC_PREFIX, '');
  return s.trim();
};
const RSS = (name: string, pc: string): string =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(`"${queryName(name)}" ${pc}`)}&hl=en-IN&gl=IN&ceid=IN:en`;

// Significant name tokens (initials/honorifics dropped) plus the surname (last token). Google News RSS
// returns loosely-related results, so a headline is kept only if it actually names the MP: the surname is
// present, or at least two name tokens are — which screens out party homepages, scheme notices and
// constituency-keyword bleed ("trains to Varanasi") while tolerating mononym usage ("Modi inaugurates").
interface NameKey {
  tokens: string[];
  surname: string | null;
}
const nameKeyOf = (name: string): NameKey => {
  const tokens = normName(name)
    .split(' ')
    .filter((t) => t.length >= MIN_NAME_TOKEN_LEN);
  return { tokens, surname: tokens.length ? tokens[tokens.length - 1] : null };
};
function namesMp(title: string, key: NameKey): boolean {
  if (!key.tokens.length) return true;
  const hay = new Set(normName(title).split(' ').filter(Boolean));
  const present = key.tokens.filter((t) => hay.has(t));
  return present.length >= 2 || (key.surname != null && hay.has(key.surname));
}

function parseRss(xml: string, key: NameKey): NewsArticle[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const out: NewsArticle[] = [];
  $('item').each((_, el) => {
    const item = $(el);
    const rawTitle = item.find('title').first().text().trim();
    const link = item.find('link').first().text().trim();
    const pub = item.find('pubDate').first().text().trim();
    const sourceEl = item.find('source').first().text().trim();
    // Google News titles read "Headline - Publisher"; prefer the <source> element, else the trailing segment.
    const tail = rawTitle.includes(' - ') ? (rawTitle.split(' - ').pop()?.trim() ?? '') : '';
    const publisher = sourceEl || tail;
    const title =
      publisher && rawTitle.endsWith(` - ${publisher}`)
        ? rawTitle.slice(0, -(publisher.length + 3)).trim()
        : rawTitle;
    if (!title || !link || !namesMp(title, key)) return;
    let date = '';
    if (pub) {
      const d = new Date(pub);
      if (!Number.isNaN(d.getTime())) date = d.toISOString();
    }
    out.push({ title, publisher, url: link, date, flagged: hasAccusatoryPhrasing(title) });
  });
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_ITEMS);
}

async function main(): Promise<void> {
  const mps = JSON.parse(await readFile(new URL('mps.json', CANON), 'utf8')) as MpLite[];
  const limit = process.argv[2] ? Number(process.argv[2]) : mps.length;
  const rows = mps.slice(0, limit);
  console.log(`Fetching Google News for ${rows.length} MPs...`);

  await mkdir(RAW, { recursive: true });
  const out: NewsRow[] = [];
  let i = 0;
  let total = 0;
  for (const m of rows) {
    const xml = await fetchTextOrNull(RSS(m.mp_name, cleanPc(m.pc_name)), { cache: false });
    await sleep(SLEEP_MS);
    if (xml) {
      const articles = parseRss(xml, nameKeyOf(m.mp_name));
      if (articles.length) {
        out.push({ pc_id: m.pc_id, articles, _provenance: PROVENANCE });
        total += articles.length;
      }
    }
    if (++i % FLUSH_EVERY === 0) {
      await writeFile(new URL('latest_news.json', RAW), JSON.stringify(out, null, 2));
      console.log(`  ${i}/${rows.length} · MPs with news ${out.length} · headlines ${total}`);
    }
  }
  await writeFile(new URL('latest_news.json', RAW), JSON.stringify(out, null, 2));
  const flagged = out.reduce((n, r) => n + r.articles.filter((a) => a.flagged).length, 0);
  console.log(
    `News resolved: ${out.length}/${rows.length} MPs · ${total} headlines (${flagged} flagged accusatory)`,
  );
  console.log('Wrote data/raw/latest_news.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
