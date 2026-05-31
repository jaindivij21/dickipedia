import { mkdir, writeFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { fetchText } from '../../lib/http.ts';
import { normConstituency, normName, normParty } from '../../lib/text.ts';
import { RAW } from '../../lib/paths.ts';

const INDEX_URL = 'https://myneta.info/LokSabha2024/index.php?action=show_winners&sort=default';
const OUT = RAW;

const rupees = (s: string): number | null => {
  const m = String(s).match(/Rs\s*([0-9][0-9,]*)/i) || String(s).match(/([0-9][0-9,]{3,})/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
const intOf = (s: string): number => {
  const m = String(s).match(/\d+/);
  return m ? Number(m[0]) : 0;
};

export async function run(): Promise<void> {
  console.log(
    'Fetching MyNeta winners index (ADR/MyNeta.info, from ECI affidavits; non-commercial, attributed)...',
  );
  const html = await fetchText(INDEX_URL);
  const $ = cheerio.load(html);
  const rows: any[] = [];
  $('table.w3-table tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 8) return; // skip header (<th>) / malformed rows
    const link = $(tds[1]).find("a[href*='candidate_id=']").last();
    const idm = (link.attr('href') || '').match(/candidate_id=(\d+)/);
    if (!idm) return;
    const name = link.text().trim();
    const constituency = $(tds[2]).text().trim();
    rows.push({
      candidate_id: Number(idm[1]),
      name,
      name_norm: normName(name),
      constituency,
      constituency_norm: normConstituency(constituency),
      party: normParty($(tds[3]).text().trim()).short,
      criminal_cases: intOf($(tds[4]).text()),
      education: $(tds[5]).text().trim(),
      total_assets: rupees($(tds[6]).text()),
      total_liabilities: rupees($(tds[7]).text()),
      source_url: `https://myneta.info/LokSabha2024/candidate.php?candidate_id=${idm[1]}`,
      _provenance: {
        source: 'ADR / MyNeta.info (from ECI affidavits)',
        license: 'Non-commercial; display + attribution',
        url: INDEX_URL,
      },
    });
  });

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL('myneta_2024.json', OUT), JSON.stringify(rows, null, 2));
  const withCrim = rows.filter((r) => r.criminal_cases > 0).length;
  const crore = rows.filter((r) => (r.total_assets ?? 0) >= 10000000).length;
  const richest = rows
    .filter((r) => r.total_assets != null)
    .sort((a, b) => b.total_assets - a.total_assets)[0];
  console.log(`MyNeta winners parsed: ${rows.length}`);
  console.log(`With >=1 declared criminal case: ${withCrim}`);
  console.log(`Crorepatis (assets >= Rs 1 crore): ${crore}`);
  if (richest)
    console.log(
      `Richest: ${richest.name} (${richest.constituency}) — Rs ${richest.total_assets.toLocaleString('en-IN')}`,
    );
  console.log(`Wrote data/raw/myneta_2024.json`);
}
