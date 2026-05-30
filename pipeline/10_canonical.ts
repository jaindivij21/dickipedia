// Pipeline steps 11-12 (v0): entity resolution — join PRS + Sansad onto the ECI 543-PC spine.
// Constituency-anchored: the PC pins the winner; name only confirms / flags for QA.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { tokenSortRatio } from "./lib/text.ts";
import type { EciSpineRow, PrsRow } from "./lib/types.ts";

const RAW = new URL("../data/raw/", import.meta.url);
const OUT = new URL("../data/canonical/", import.meta.url);
const loadRaw = async <T>(f: string): Promise<T> => JSON.parse(await readFile(new URL(f, RAW), "utf8")) as T;

const STATE_ALIASES: Record<string, string> = {
  "NCT OF DELHI": "DELHI",
  "ORISSA": "ODISHA",
  "PONDICHERRY": "PUDUCHERRY",
  "UTTARANCHAL": "UTTARAKHAND",
};
const normState = (s = ""): string => {
  const up = String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
  return STATE_ALIASES[up] || up;
};

interface Joinable { name: string; state: string; constituency_norm: string; }
type SrcIndex<T> = { byStateConst: Map<string, T[]>; byConst: Map<string, T[]> };

function pushMap<T>(m: Map<string, T[]>, k: string, v: T): void {
  const a = m.get(k);
  if (a) a.push(v); else m.set(k, [v]);
}
function indexBy<T extends Joinable>(rows: T[]): SrcIndex<T> {
  const byStateConst = new Map<string, T[]>();
  const byConst = new Map<string, T[]>();
  for (const r of rows) {
    pushMap(byStateConst, `${normState(r.state)}|${r.constituency_norm}`, r);
    pushMap(byConst, r.constituency_norm, r);
  }
  return { byStateConst, byConst };
}
function matchSource<T extends Joinable>(spine: EciSpineRow, idx: SrcIndex<T>): { row: T | null; method: string; confidence: number } {
  let cands = idx.byStateConst.get(`${normState(spine.eci_state)}|${spine.pc_name_norm}`) ?? [];
  let method = "state+constituency";
  if (!cands.length) { cands = idx.byConst.get(spine.pc_name_norm) ?? []; method = "constituency-only"; }
  if (!cands.length) return { row: null, method: "unmatched", confidence: 0 };
  let best = cands[0], bestC = -1;
  for (const c of cands) { const conf = tokenSortRatio(spine.winner_name, c.name); if (conf > bestC) { bestC = conf; best = c; } }
  return { row: best, method: cands.length > 1 ? `${method}/ambiguous` : method, confidence: bestC };
}

async function main(): Promise<void> {
  const spine = await loadRaw<EciSpineRow[]>("eci_spine.json");
  const prs = await loadRaw<PrsRow[]>("prs_18th.json");
  const sansad = await loadRaw<(Joinable & Record<string, any>)[]>("sansad_18th.json");
  const prsIdx = indexBy(prs);
  const sanIdx = indexBy(sansad);

  const crosswalk: any[] = [];
  const canonical = spine.map((s) => {
    const p = matchSource(s, prsIdx);
    const sa = matchSource(s, sanIdx);
    const pr = p.row;
    const san = sa.row as any;
    crosswalk.push({
      pc_id: s.pc_id, pc_name: s.pc_name, eci_state: s.eci_state, winner: s.winner_name,
      prs: { matched: !!pr, method: p.method, confidence: p.confidence },
      sansad: { matched: !!san, mpsno: san?.mpsno ?? null, method: sa.method, confidence: sa.confidence },
    });
    return {
      pc_id: s.pc_id, pc_name: s.pc_name, eci_state: s.eci_state, reservation: s.reservation,
      mp_name: (san?.name as string) || pr?.name || s.winner_name,
      party: s.winner_party, party_full: s.winner_party_full,
      // identity (Sansad)
      mpsno: san?.mpsno ?? null, gender: san?.gender ?? pr?.gender ?? null,
      age: san?.age ?? pr?.age ?? null, dob: san?.dob ?? null,
      profession: san?.profession ?? null, qualification: san?.qualification ?? pr?.education ?? null,
      terms: san?.terms ?? pr?.terms ?? null,
      email: san?.email ?? null, phone: san?.phone ?? null,
      photo_hotlink: san?.photo_hotlink ?? null, profile_url: san?.profile_url ?? null,
      // mandate (ECI)
      margin_votes: s.margin_votes, winner_vote_share: s.winner_vote_share,
      runner_up_name: s.runner_up_name, runner_up_party: s.runner_up_party,
      num_candidates: s.num_candidates, nota_votes: s.nota_votes, nota_gt_margin: s.nota_gt_margin,
      // parliamentary work (PRS)
      minister: pr?.minister ?? null, prs_reported: pr ? pr.reported : false,
      attendance_pct: pr?.attendance_pct ?? null, debates: pr?.debates ?? null,
      questions: pr?.questions ?? null, pmbs: pr?.pmbs ?? null,
      questions_by_ministry: pr?.questions_by_ministry ?? {},
      _match: { prs: p.method, prs_conf: p.confidence, sansad: sa.method, sansad_conf: sa.confidence },
    };
  });

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL("mps.json", OUT), JSON.stringify(canonical, null, 2));
  await writeFile(new URL("crosswalk.json", OUT), JSON.stringify(crosswalk, null, 2));

  const prsMatched = crosswalk.filter((c) => c.prs.matched).length;
  const sanMatched = crosswalk.filter((c) => c.sansad.matched).length;
  const lowConf = crosswalk.filter((c) => c.prs.matched && c.prs.confidence < 70).length;
  const unPrs = crosswalk.filter((c) => !c.prs.matched).map((c) => c.pc_name);
  console.log(`Canonical rows: ${canonical.length}`);
  console.log(`PRS matched: ${prsMatched}/543 (name-confidence <70 to review: ${lowConf})`);
  console.log(`Sansad matched: ${sanMatched}/543`);
  if (unPrs.length) console.log(`PCs with no PRS match (manual queue, first 15): ${unPrs.slice(0, 15).join(", ")}`);
  console.log(`Wrote data/canonical/mps.json + crosswalk.json`);
}
main().catch((e) => { console.error(e); process.exit(1); });
