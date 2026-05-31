import { mkdir, writeFile, readFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { fetchText } from './lib/http.ts';
import { normName, tokenSortRatio } from './lib/text.ts';

const URL_ = 'https://myneta.info/LokSabha2024/index.php?action=recontestAssetsComparison';
const RAW = new URL('../data/raw/', import.meta.url);
const num = (s: string): number | null => {
  const m = String(s).match(/([0-9][0-9,]{2,})/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
};
const pct = (s: string): number | null => {
  const m = String(s).match(/-?[\d.]+/);
  return m ? Number(m[0]) : null;
};

async function main(): Promise<void> {
  console.log('Fetching MyNeta wealth-growth (recontestAssetsComparison)...');
  const $ = cheerio.load(await fetchText(URL_));
  const winners = JSON.parse(await readFile(new URL('myneta_2024.json', RAW), 'utf8')) as any[];
  const byName = new Map<string, any>();
  for (const w of winners) byName.set(w.name_norm, w);

  const rows: any[] = [];
  $('table tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 6) return;
    const nameParty = $(tds[1]).text().trim();
    if (!nameParty) return;
    const name = nameParty.split(/\s*\(/)[0].trim();
    if (!name) return;
    const nn = normName(name);
    let w = byName.get(nn);
    if (!w) {
      let best: any = null,
        bc = 0;
      for (const cand of winners) {
        const c = tokenSortRatio(name, cand.name);
        if (c > bc) {
          bc = c;
          best = cand;
        }
      }
      if (bc >= 90) w = best;
    }
    rows.push({
      name,
      name_norm: nn,
      constituency_norm: w?.constituency_norm ?? null,
      candidate_id: w?.candidate_id ?? null,
      assets_2024: num($(tds[2]).text()),
      assets_2019: num($(tds[3]).text()),
      asset_increase: num($(tds[4]).text()),
      pct_increase: pct($(tds[5]).text()),
      _provenance: {
        source: 'ADR/MyNeta.info recontestAssetsComparison (from ECI affidavits)',
        license: 'Non-commercial; display + attribution',
        url: URL_,
      },
    });
  });

  await mkdir(RAW, { recursive: true });
  await writeFile(new URL('myneta_wealth.json', RAW), JSON.stringify(rows, null, 2));
  const matched = rows.filter((r) => r.constituency_norm).length;
  const top = rows
    .filter((r) => r.pct_increase != null)
    .sort((a, b) => b.pct_increase - a.pct_increase)[0];
  console.log(`Wealth-growth rows: ${rows.length}; joined to a constituency: ${matched}`);
  if (top)
    console.log(
      `Biggest % jump: ${top.name} +${top.pct_increase}% (Rs ${(top.assets_2019 ?? 0).toLocaleString('en-IN')} -> Rs ${(top.assets_2024 ?? 0).toLocaleString('en-IN')})`,
    );
  console.log('Wrote data/raw/myneta_wealth.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
