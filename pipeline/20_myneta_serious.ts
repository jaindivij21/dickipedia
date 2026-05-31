import { mkdir, writeFile, readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { fetchText, sleep } from './lib/http.ts';
import type { Provenance } from './lib/types.ts';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
const LIST = (page: number): string =>
  `https://myneta.info/LokSabha2024/index.php?action=summary&subAction=winner_serious_crime&sort=candidate&page=${page}`;
const SLEEP_MS = 800;
const MAX_PAGES = 30;
const PROVENANCE: Provenance = {
  source: 'ADR / MyNeta.info (from ECI sworn affidavits)',
  license: 'Non-commercial; display + attribution',
  url: 'https://myneta.info/LokSabha2024/index.php?action=summary&subAction=winner_serious_crime',
};

interface CrosswalkRow {
  pc_id: string;
  myneta: { matched: boolean; candidate_id: number | null };
}
interface SeriousRow {
  pc_id: string;
  candidate_id: number;
  source_url: string;
  _provenance: Provenance;
}

function candidateIdsOnPage($: CheerioAPI): number[] {
  const ids = new Set<number>();
  $("table.w3-table a[href*='candidate_id=']").each((_, a) => {
    const m = ($(a).attr('href') || '').match(/candidate_id=(\d+)/);
    if (m) ids.add(Number(m[1]));
  });
  return [...ids];
}

async function main(): Promise<void> {
  console.log(
    'Fetching MyNeta winners with declared serious criminal cases (ADR/MyNeta.info, from ECI affidavits)...',
  );
  const serious = new Set<number>();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const $ = cheerio.load(await fetchText(LIST(page)));
    const ids = candidateIdsOnPage($);
    if (ids.length === 0) break;
    ids.forEach((id) => serious.add(id));
    process.stdout.write(`  page ${page}: ${ids.length} winners (running total ${serious.size})\n`);
    await sleep(SLEEP_MS);
  }

  const crosswalk = JSON.parse(
    await readFile(new URL('crosswalk.json', CANON), 'utf8'),
  ) as CrosswalkRow[];
  const rows: SeriousRow[] = [];
  let unmatched = 0;
  for (const c of crosswalk) {
    const id = c.myneta.candidate_id;
    if (id != null && serious.has(id)) {
      rows.push({
        pc_id: c.pc_id,
        candidate_id: id,
        source_url: `https://myneta.info/LokSabha2024/candidate.php?candidate_id=${id}`,
        _provenance: PROVENANCE,
      });
    }
  }
  for (const id of serious) {
    if (!crosswalk.some((c) => c.myneta.candidate_id === id)) unmatched++;
  }

  await mkdir(RAW, { recursive: true });
  await writeFile(new URL('myneta_serious.json', RAW), JSON.stringify(rows, null, 2));
  console.log(
    `MyNeta serious-crime winners: ${serious.size} listed · ${rows.length} joined to spine · ${unmatched} unmatched`,
  );
  console.log('Wrote data/raw/myneta_serious.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
