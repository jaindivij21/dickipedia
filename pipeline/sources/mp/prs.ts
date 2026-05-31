import { mkdir, writeFile } from 'node:fs/promises';
import { RAW } from '../../lib/paths.ts';
import { fetchText } from '../../lib/http.ts';
import { parseCSVObjects } from '../../lib/csv.ts';
import { normConstituency, normName, normParty } from '../../lib/text.ts';
import type { PrsRow } from '../../lib/types.ts';

const PRS_CSV =
  'https://raw.githubusercontent.com/Vonter/india-representatives-activity/main/csv/Lok%20Sabha/18th.csv';
const OUT = RAW;
const num = (s: string | undefined): number | null => {
  const n = Number(
    String(s ?? '')
      .replace(/[%,]/g, '')
      .trim(),
  );
  return Number.isFinite(n) ? n : null;
};

export async function run(): Promise<void> {
  console.log(
    'Fetching PRS/Vonter 18th LS activity (ODbL-1.0; attribute PRS Legislative Research)...',
  );
  const rows = parseCSVObjects(await fetchText(PRS_CSV), ';');
  const out: PrsRow[] = rows.map((r) => {
    const ministry: Record<string, number> = {};
    for (const [k, v] of Object.entries(r)) {
      const m = k.match(/^Questions \((.+)\)$/);
      if (m) {
        const val = num(v);
        if (val) ministry[m[1]] = val;
      }
    }
    const isMinister = /^y/i.test(r['Minister'] || '');
    return {
      name: (r['Name'] || '').trim(),
      name_norm: normName(r['Name']),
      constituency: (r['Constituency'] || '').trim(),
      constituency_norm: normConstituency(r['Constituency']),
      state: (r['State'] || '').trim(),
      party: normParty(r['Party']).short,
      minister: isMinister,
      attendance_pct: isMinister ? null : num(r['Attendance']),
      debates: isMinister ? null : num(r['Debates']),
      questions: isMinister ? null : num(r['Questions']),
      pmbs: isMinister ? null : num(r['Private Member Bills']),
      terms: num(r['No. of Term']),
      age: num(r['Age']),
      gender: (r['Gender'] || '').trim(),
      education: (r['Education'] || '').trim(),
      questions_by_ministry: ministry,
      reported: !isMinister, // ministers/Speaker => PRS metrics "not reported"
      _provenance: {
        source: 'PRS Legislative Research via Vonter mirror',
        license: 'ODbL-1.0',
        url: PRS_CSV,
      },
    };
  });

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL('prs_18th.json', OUT), JSON.stringify(out, null, 2));

  const nonMin = out.filter((m) => m.reported);
  const avgAtt =
    Math.round(
      (nonMin.reduce((s, m) => s + (m.attendance_pct || 0), 0) / (nonMin.length || 1)) * 10,
    ) / 10;
  console.log(`PRS rows: ${out.length}; ministers/not-reported: ${out.length - nonMin.length}`);
  console.log(`Avg attendance (non-ministers): ${avgAtt}%`);
  console.log(
    `Zero-question MPs (non-ministers): ${nonMin.filter((m) => m.questions === 0).length}`,
  );
  console.log(`Wrote ${new URL('prs_18th.json', OUT).pathname}`);
}
