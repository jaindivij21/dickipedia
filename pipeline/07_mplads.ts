import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import axios from 'axios';
import { sleep } from './lib/http.ts';
import { normName } from './lib/text.ts';

const BASE = 'https://mplads.mospi.gov.in/rest/PreLoginDashboardData';
const DASH = 'https://mplads.mospi.gov.in/digigov/dashboard.html';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const OUT = new URL('../data/raw/', import.meta.url);
const STATE_LIMIT = process.env.STATE_LIMIT ? Number(process.env.STATE_LIMIT) : 0;

const rupee = (s: unknown): number | null => {
  const n = Number(String(s ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : null;
};
const intOf = (s: unknown): number => {
  const m = String(s ?? '').match(/\d+/);
  return m ? Number(m[0]) : 0;
};

async function main(): Promise<void> {
  const ax = axios.create({ headers: { 'User-Agent': UA }, timeout: 60000 });
  const dash = await ax.get(DASH);
  const cookie = ((dash.headers['set-cookie'] as string[]) || [])
    .map((c) => c.split(';')[0])
    .join('; ');
  const post = async (ep: string, body: any): Promise<any> => {
    const r = await ax.post(`${BASE}/${ep}`, body, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Referer: DASH,
        Cookie: cookie,
      },
    });
    return r.data;
  };

  const states: { STATE_ID: number; STATE_NAME: string }[] = await post('getStateData', {});
  const outFile = new URL('mplads.json', OUT);
  const out: any[] = existsSync(outFile) ? JSON.parse(await readFile(outFile, 'utf8')) : [];
  const done = new Set(out.map((o) => o.mpId));

  let si = 0;
  for (const st of states) {
    if (STATE_LIMIT && si >= STATE_LIMIT) break;
    si++;
    const mps: { ID: number; CAPTION: string }[] = await post('getMpNamesData', {
      state_combo: `${st.STATE_ID},2,7`,
    });
    await sleep(400);
    for (const mp of mps) {
      if (done.has(mp.ID)) continue;
      let t: any;
      try {
        t = await post('getTilesData', { uname: `${st.STATE_ID},0,${mp.ID},2` });
      } catch (e: any) {
        console.error('tiles fail', mp.ID, e.message);
        await sleep(1500);
        continue;
      }
      const alloc = rupee(t['Allocated Limit for']?.[0]);
      const exp = rupee(t['Expenditure on Completed and On-going Works as on Date']?.[0]);
      out.push({
        mpId: mp.ID,
        name: mp.CAPTION,
        name_norm: normName(mp.CAPTION),
        state: st.STATE_NAME,
        allocated: alloc,
        expenditure: exp,
        unspent: alloc != null && exp != null ? alloc - exp : null,
        utilisation_pct: alloc && exp != null ? Math.round((exp / alloc) * 1000) / 10 : null,
        works_recommended: intOf(t['Works Recommended']?.[0]),
        works_sanctioned: intOf(t['Works Sanctioned']?.[0]),
        works_completed: intOf(t['Works Completed']?.[0]),
        _provenance: { source: 'MPLADS eSAKSHI (MoSPI)', license: 'GODL-India', url: DASH },
      });
      done.add(mp.ID);
      await sleep(550);
    }
    await mkdir(OUT, { recursive: true });
    await writeFile(outFile, JSON.stringify(out, null, 2));
    console.log(`${st.STATE_NAME}: ${mps.length} MPs (total ${out.length})`);
  }

  const low = out
    .filter((o) => o.utilisation_pct != null)
    .sort((a, b) => a.utilisation_pct - b.utilisation_pct)[0];
  console.log(`MPLADS MPs: ${out.length}`);
  if (low)
    console.log(
      `Lowest fund utilisation: ${low.name} (${low.state}) — ${low.utilisation_pct}% spent`,
    );
  console.log('Wrote data/raw/mplads.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
