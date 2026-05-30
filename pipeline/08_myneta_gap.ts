// Pipeline gap-close: recover MyNeta winners missing from show_winners (485) via per-constituency pages.
// Homepage: constituency_id -> name. show_candidates&constituency_id=N -> winner row (criminal/assets/etc.).
import { readFile, writeFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { fetchText, sleep } from './lib/http.ts';
import { normConstituency, normName, normParty, tokenSortRatio } from './lib/text.ts';

const HOME = 'https://myneta.info/LokSabha2024/';
const BASE = 'https://myneta.info/LokSabha2024/index.php';
const RAW = new URL('../data/raw/', import.meta.url);
const rupees = (s: string): number | null => {
  const m = String(s).match(/Rs\s*([0-9][0-9,]*)/i);
  return m ? Number(m[1].replace(/,/g, '')) : null;
};
const intOf = (s: string): number => {
  const m = String(s).match(/\d+/);
  return m ? Number(m[0]) : 0;
};

async function main(): Promise<void> {
  // 1. homepage constituency_id -> name
  const $h = cheerio.load(await fetchText(HOME));
  const constMap = new Map<string, { id: string; name: string }>();
  $h("a[href*='constituency_id=']").each((_, a) => {
    const m = ($h(a).attr('href') || '').match(/constituency_id=(\d+)/);
    const name = $h(a).text().trim();
    if (!m || !name || /ALL CONSTITUENC/i.test(name)) return;
    constMap.set(normConstituency(name), { id: m[1], name });
  });
  console.log(`Homepage constituencies: ${constMap.size}`);

  // 2. existing coverage
  const spine = JSON.parse(await readFile(new URL('eci_spine.json', RAW), 'utf8')) as any[];
  const myneta = JSON.parse(await readFile(new URL('myneta_2024.json', RAW), 'utf8')) as any[];
  const covered = new Set(myneta.map((m) => m.constituency_norm));
  const missing = spine.filter((s) => !covered.has(s.pc_name_norm));
  console.log(`MyNeta covered: ${covered.size} · missing constituencies: ${missing.length}`);

  // 3. recover each missing via per-constituency winner row
  const newRows: any[] = [];
  const notFound: string[] = [];
  for (const s of missing) {
    let entry = constMap.get(s.pc_name_norm);
    if (!entry) {
      let best: { id: string; name: string } | null = null,
        bc = 0;
      for (const [k, v] of constMap) {
        const sc = tokenSortRatio(k, s.pc_name_norm);
        if (sc > bc) {
          bc = sc;
          best = v;
        }
      }
      if (bc >= 88) entry = best!;
    }
    if (!entry) {
      notFound.push(s.pc_name);
      continue;
    }
    const $ = cheerio.load(
      await fetchText(`${BASE}?action=show_candidates&constituency_id=${entry.id}`),
    );
    await sleep(1100);
    let win: any = null;
    $('table.w3-table tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length < 8 || !/winner/i.test($(tds[1]).text())) return;
      const idm = ($(tds[1]).find("a[href*='candidate_id=']").last().attr('href') || '').match(
        /candidate_id=(\d+)/,
      );
      if (!idm) return;
      win = {
        candidate_id: Number(idm[1]),
        name: $(tds[1])
          .text()
          .replace(/winner/i, '')
          .replace(/\s+/g, ' ')
          .trim(),
        party: $(tds[2]).text().trim(),
        criminal: intOf($(tds[3]).text()),
        education: $(tds[4]).text().trim(),
        assets: rupees($(tds[6]).text()),
        liabilities: rupees($(tds[7]).text()),
      };
    });
    if (!win) {
      notFound.push(`${s.pc_name} (no winner row)`);
      continue;
    }
    newRows.push({
      candidate_id: win.candidate_id,
      name: win.name,
      name_norm: normName(win.name),
      constituency: s.pc_name,
      constituency_norm: s.pc_name_norm,
      party: normParty(win.party).short,
      criminal_cases: win.criminal,
      education: win.education,
      total_assets: win.assets,
      total_liabilities: win.liabilities,
      source_url: `https://myneta.info/LokSabha2024/candidate.php?candidate_id=${win.candidate_id}`,
      _provenance: {
        source: 'ADR / MyNeta.info (from ECI affidavits)',
        license: 'Non-commercial; display + attribution',
        url: HOME,
      },
    });
  }

  const merged = [...myneta, ...newRows];
  await writeFile(new URL('myneta_2024.json', RAW), JSON.stringify(merged, null, 2));
  console.log(`Recovered ${newRows.length} winners → MyNeta total ${merged.length}/543`);
  if (notFound.length)
    console.log(`Still absent (${notFound.length}): ${notFound.slice(0, 25).join(', ')}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
