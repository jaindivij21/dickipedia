// Pipeline step 16: supplementary party-site contact (INC / BJP), used ONLY to fill gaps left by the
// Sansad directory (which already covers ~98% of contact). Targets the residual no-contact MPs, scrapes
// the party member listings best-effort, and records any mailto:/tel: found. Never fatal: a blocked site
// or empty result yields {} and the merge proceeds. Facts + deeplink only.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { fetchTextOrNull, sleep } from './lib/http.ts';
import { deobfuscateContact, tokenSortRatio } from './lib/text.ts';
import type { Provenance } from './lib/types.ts';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
const INC_PAGE = (p: number): string => `https://inc.in/lok-sabha-members?page=${p}`;
const INC_MAX_PAGES = 12;
const SLEEP_MS = 500;
const NAME_FUZZY = 82;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PROVENANCE: Provenance = {
  source: 'Indian National Congress (inc.in) / Bharatiya Janata Party (bjp.org)',
  license: 'Facts + deeplink only',
  url: 'https://inc.in/lok-sabha-members',
};

interface CrosswalkRow {
  pc_id: string;
  winner: string;
  winner_party: string;
}
interface SansadDeepRow {
  pc_id: string;
  contact: { emails: string[]; phones: string[] } | null;
}
interface PartyContactRow {
  pc_id: string;
  emails: string[];
  phones: string[];
  source: 'inc';
  _provenance: Provenance;
}

async function scrapeIncContacts(): Promise<
  { name: string; emails: string[]; phones: string[] }[]
> {
  const out: { name: string; emails: string[]; phones: string[] }[] = [];
  for (let p = 0; p < INC_MAX_PAGES; p++) {
    const html = await fetchTextOrNull(INC_PAGE(p));
    await sleep(SLEEP_MS);
    if (!html) break;
    const $ = cheerio.load(html);
    const before = out.length;
    $("a[href*='/lok-sabha-member']").each((_, a) => {
      const name = $(a).text().trim();
      if (!name || /lok-sabha-members/.test($(a).attr('href') ?? '')) return;
      const block = $(a).closest('article, .views-row, li, div');
      const text = deobfuscateContact(block.text());
      const emails = [...new Set((text.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase()))];
      const phones = [
        ...new Set(
          (text.match(/(?:\+?91[-\s]?)?[6-9]\d{9}/g) ?? []).map((d) =>
            d.replace(/[^\d]/g, '').slice(-10),
          ),
        ),
      ];
      if (emails.length || phones.length) out.push({ name, emails, phones });
    });
    if (out.length === before && p > 0) break;
  }
  return out;
}

async function main(): Promise<void> {
  const crosswalk = JSON.parse(
    await readFile(new URL('crosswalk.json', CANON), 'utf8'),
  ) as CrosswalkRow[];
  const sansad = JSON.parse(
    await readFile(new URL('sansad_deep.json', RAW), 'utf8').catch(() => '[]'),
  ) as SansadDeepRow[];
  const haveContact = new Set(
    sansad
      .filter((r) => (r.contact?.emails.length ?? 0) > 0 || (r.contact?.phones.length ?? 0) > 0)
      .map((r) => r.pc_id),
  );
  const gaps = crosswalk.filter((r) => !haveContact.has(r.pc_id) && r.winner_party === 'INC');
  console.log(`Contact gaps targetable via INC: ${gaps.length}`);

  await mkdir(RAW, { recursive: true });
  const out: PartyContactRow[] = [];
  if (gaps.length) {
    const inc = await scrapeIncContacts();
    for (const g of gaps) {
      let best: { name: string; emails: string[]; phones: string[] } | null = null,
        bc = -1;
      for (const c of inc) {
        const sc = tokenSortRatio(g.winner, c.name);
        if (sc > bc) {
          bc = sc;
          best = c;
        }
      }
      if (best && bc >= NAME_FUZZY && (best.emails.length || best.phones.length))
        out.push({
          pc_id: g.pc_id,
          emails: best.emails,
          phones: best.phones,
          source: 'inc',
          _provenance: PROVENANCE,
        });
    }
  }
  await writeFile(new URL('party_contact.json', RAW), JSON.stringify(out, null, 2));
  console.log(`Party-site contact gap-fills: ${out.length}`);
  console.log('Wrote data/raw/party_contact.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
