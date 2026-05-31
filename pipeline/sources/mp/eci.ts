import { mkdir, writeFile } from 'node:fs/promises';
import { fetchText } from '../../lib/http.ts';
import { parseCSVObjects } from '../../lib/csv.ts';
import { normConstituency, normName, normParty } from '../../lib/text.ts';
import { reservationFor } from '../../lib/reservation.ts';
import type { EciSpineRow } from '../../lib/types.ts';
import { RAW } from '../../lib/paths.ts';

const WINNERS_CSV =
  'https://data.opencity.in/dataset/85a345c6-78c0-4f57-adfc-236c726c5456/resource/3e96ed32-9b97-4c5b-9201-7807d90b20e5/download/2a4e0925-0903-4857-902b-9a57cfb78094.csv';
const RESULTS_CSV =
  'https://data.opencity.in/dataset/85a345c6-78c0-4f57-adfc-236c726c5456/resource/d164b73a-b855-4b68-be0c-0f3450e7ab9f/download/1b837c18-4f7a-4acb-aad0-918c51186a54.csv';

const OUT = RAW;
const num = (s: string | undefined): number =>
  Number(String(s ?? '').replace(/[^0-9.-]/g, '')) || 0;
const pcKey = (state: string, pcNo: string): string =>
  `${normConstituency(state).toLowerCase().replace(/\s+/g, '-')}-${String(pcNo).trim()}`;
const isNota = (s: string | undefined): boolean => /\bNOTA\b|None of the Above/i.test(s || '');

export async function run(): Promise<void> {
  console.log('Fetching ECI winners + full results (opencity CKAN, Public Domain)...');
  const winners = parseCSVObjects(await fetchText(WINNERS_CSV));
  const results = parseCSVObjects(await fetchText(RESULTS_CSV));

  const byPc = new Map<string, Record<string, string>[]>();
  for (const r of results) {
    const k = pcKey(r['State'], r['PC No']);
    if (!byPc.has(k)) byPc.set(k, []);
    byPc.get(k)!.push(r);
  }

  const spine: EciSpineRow[] = winners.map((w) => {
    const k = pcKey(w['State'], w['PC No']);
    const cands = byPc.get(k) || [];
    const nonNota = cands.filter((c) => !isNota(c['Candidate']));
    const nota = cands.find((c) => isNota(c['Candidate']));
    const winnerRow = nonNota.find(
      (c) => normName(c['Candidate']) === normName(w['Winning Candidate']),
    );
    const validVotes = cands.reduce((s, c) => s + num(c['Total Votes']), 0);
    const margin = num(w['Margin Votes']);
    const notaVotes = nota ? num(nota['Total Votes']) : 0;
    return {
      pc_id: k,
      eci_state: (w['State'] || '').trim(),
      eci_pc_no: (w['PC No'] || '').trim(),
      pc_name: (w['PC Name'] || '').trim(),
      pc_name_norm: normConstituency(w['PC Name']),
      reservation: reservationFor(w['State'], w['PC Name']),
      winner_name: (w['Winning Candidate'] || '').trim(),
      winner_party: normParty(w['Winning Party']).short,
      winner_party_full: (w['Winning Party'] || '').trim(),
      runner_up_name: (w['Runner-up Canddiate'] || '').trim(),
      runner_up_party: normParty(w['Runner-up Party']).short,
      margin_votes: margin,
      winner_total_votes: winnerRow ? num(winnerRow['Total Votes']) : null,
      winner_vote_share: winnerRow ? num(winnerRow['Vote Share']) : null,
      num_candidates: nonNota.length,
      nota_votes: notaVotes,
      nota_gt_margin: notaVotes > 0 && notaVotes > margin,
      valid_votes: validVotes || null,
      status: (w['Results Status'] || '').trim(),
      _provenance: {
        source: 'ECI via opencity.in CKAN',
        license: 'Public Domain',
        url: WINNERS_CSV,
      },
    };
  });

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL('eci_spine.json', OUT), JSON.stringify(spine, null, 2));

  const matched = spine.filter((s) => s.winner_total_votes != null).length;
  const notaFlag = spine.filter((s) => s.nota_gt_margin).length;
  console.log(`ECI spine rows: ${spine.length} (expected 543)`);
  console.log(`Winner vote totals matched from full results: ${matched}/${spine.length}`);
  console.log(`PCs where NOTA > winning margin: ${notaFlag}`);
  console.log(`Wrote ${new URL('eci_spine.json', OUT).pathname}`);
}
