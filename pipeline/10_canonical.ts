// Pipeline steps 11-13: entity resolution + full canonical assembly (all 7 sources) + accountability score.
// Constituency-anchored join off the ECI 543 spine; fuzzy fallback recovers spelling gaps. Output feeds the DB seed.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { normConstituency, normName, normParty, tokenSortRatio } from "./lib/text.ts";
import type { EciSpineRow, PrsRow } from "./lib/types.ts";

const RAW = new URL("../data/raw/", import.meta.url);
const OUT = new URL("../data/canonical/", import.meta.url);
const load = async <T>(f: string): Promise<T> => JSON.parse(await readFile(new URL(f, RAW), "utf8")) as T;

const STATE_ALIASES: Record<string, string> = { "NCT OF DELHI": "DELHI", "ORISSA": "ODISHA", "PONDICHERRY": "PUDUCHERRY", "UTTARANCHAL": "UTTARAKHAND" };
const normState = (s = ""): string => {
  const up = String(s).normalize("NFKD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
  return STATE_ALIASES[up] || up;
};
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// best fuzzy match of name within a candidate list
function pick<T>(name: string, cands: T[], getName: (c: T) => string, threshold: number): { row: T | null; conf: number } {
  let best: T | null = null, bc = -1;
  for (const c of cands) { const s = tokenSortRatio(name, getName(c)); if (s > bc) { bc = s; best = c; } }
  return bc >= threshold ? { row: best, conf: bc } : { row: null, conf: bc < 0 ? 0 : bc };
}

async function main(): Promise<void> {
  const spine = await load<EciSpineRow[]>("eci_spine.json");
  const prs = await load<PrsRow[]>("prs_18th.json");
  const sansad = await load<any[]>("sansad_18th.json");
  const myneta = await load<any[]>("myneta_2024.json");
  const wealth = await load<any[]>("myneta_wealth.json");
  const mplads = await load<any[]>("mplads.json");
  const bondsDoc = await load<{ parties: any[] }>("electoral_bonds.json");

  // indexes
  const byKey = <T extends { state?: string; constituency_norm: string }>(rows: T[]) => {
    const sc = new Map<string, T[]>(), c = new Map<string, T[]>();
    for (const r of rows) {
      const k = `${normState(r.state || "")}|${r.constituency_norm}`;
      (sc.get(k) ?? sc.set(k, []).get(k)!).push(r);
      (c.get(r.constituency_norm) ?? c.set(r.constituency_norm, []).get(r.constituency_norm)!).push(r);
    }
    return { sc, c };
  };
  const prsIdx = byKey(prs), sanIdx = byKey(sansad), mnIdx = byKey(myneta), wIdx = byKey(wealth);
  const mpladsByState = new Map<string, any[]>();
  for (const m of mplads) (mpladsByState.get(normState(m.state)) ?? mpladsByState.set(normState(m.state), []).get(normState(m.state))!).push(m);

  // resolve a state+constituency source (PRS/Sansad), name-confirm
  const resolveSC = <T extends { state?: string; constituency_norm: string; name?: string }>(s: EciSpineRow, idx: { sc: Map<string, T[]>; c: Map<string, T[]> }) => {
    let cands = idx.sc.get(`${normState(s.eci_state)}|${s.pc_name_norm}`) ?? [];
    if (!cands.length) cands = idx.c.get(s.pc_name_norm) ?? [];
    if (!cands.length) { // fuzzy over constituency-only
      for (const [cn, rows] of idx.c) if (tokenSortRatio(cn, s.pc_name_norm) >= 90) { cands = rows; break; }
    }
    if (!cands.length) return null;
    return pick(s.winner_name, cands, (r) => r.name || "", 0).row ?? cands[0];
  };
  // resolve a constituency-only source (MyNeta), fuzzy fallback
  const resolveC = <T extends { constituency_norm: string; name?: string }>(s: EciSpineRow, idx: { c: Map<string, T[]> }) => {
    let cands = idx.c.get(s.pc_name_norm) ?? [];
    if (!cands.length) for (const [cn, rows] of idx.c) if (tokenSortRatio(cn, s.pc_name_norm) >= 90) { cands = rows; break; }
    return cands.length ? (pick(s.winner_name, cands, (r) => r.name || "", 0).row ?? cands[0]) : null;
  };

  const cov: Record<string, number> = { prs: 0, sansad: 0, myneta: 0, wealth: 0, mplads: 0, bonds: 0 };
  const partySeen = new Map<string, { code: string; full: string; members: number; bond_total: number; bond_count: number; rank: number | null; top_donors: any[] }>();

  const mps = spine.map((s) => {
    const pr = resolveSC(s, prsIdx) as PrsRow | null;
    const san = resolveSC(s, sanIdx) as any;
    const mn = resolveC(s, mnIdx) as any;
    const w = resolveC(s, wIdx) as any;
    // MPLADS: name within state
    const mpName = san?.name || pr?.name || s.winner_name;
    const mplRow = pick(mpName, mpladsByState.get(normState(s.eci_state)) || [], (r) => r.name || "", 80).row as any;
    // party funding: fuzzy full-name
    const bond = pick(s.winner_party_full, bondsDoc.parties, (p) => p.party_full || "", 80).row as any;

    if (pr) cov.prs++; if (san) cov.sansad++; if (mn) cov.myneta++; if (w) cov.wealth++; if (mplRow) cov.mplads++; if (bond) cov.bonds++;

    // accountability score (v1): performance base - integrity deduction (criminal, self-declared)
    const minister = pr?.minister ?? false;
    const util = mplRow?.utilisation_pct ?? null;
    let performance: number | null = null;
    if (!minister && pr) {
      const att = pr.attendance_pct ?? 0;
      const q = clamp((pr.questions ?? 0) / 2);     // ~200 questions ≈ full (rough cohort cap)
      const d = clamp((pr.debates ?? 0) * 2);       // ~50 debates ≈ full
      const pm = clamp((pr.pmbs ?? 0) * 25);        // a few PMBs ≈ strong
      const u = util ?? 0;
      performance = Math.round(att * 0.25 + q * 0.20 + d * 0.15 + pm * 0.10 + u * 0.30);
    } else if (util != null) {
      performance = Math.round(util); // ministers: MPLADS-only track
    }
    const crim = mn?.criminal_cases ?? 0;
    const deduction = Math.min(crim * 6, 36); // declared cases (as self-declared); deep-pass refines by severity
    const score = performance != null ? clamp(performance - deduction) : null;

    // party rollup
    const pcode = s.winner_party;
    if (!partySeen.has(pcode)) partySeen.set(pcode, { code: pcode, full: s.winner_party_full, members: 0, bond_total: bond?.bond_total ?? 0, bond_count: bond?.bond_count ?? 0, rank: bond?.rank ?? null, top_donors: bond?.top_donors ?? [] });
    partySeen.get(pcode)!.members++;

    return {
      pc_id: s.pc_id, pc_name: s.pc_name, eci_state: s.eci_state, reservation: s.reservation,
      mp_name: mpName, party: s.winner_party, party_full: s.winner_party_full,
      // identity (Sansad)
      mpsno: san?.mpsno ?? null, gender: san?.gender ?? pr?.gender ?? null, age: san?.age ?? pr?.age ?? null,
      dob: san?.dob ?? null, profession: san?.profession ?? null,
      qualification: san?.qualification ?? mn?.education ?? pr?.education ?? null,
      terms: san?.terms ?? pr?.terms ?? null, email: san?.email ?? null, phone: san?.phone ?? null,
      photo_hotlink: san?.photo_hotlink ?? null, profile_url: san?.profile_url ?? null,
      // mandate (ECI)
      margin_votes: s.margin_votes, winner_vote_share: s.winner_vote_share, runner_up_name: s.runner_up_name,
      runner_up_party: s.runner_up_party, num_candidates: s.num_candidates, nota_votes: s.nota_votes, nota_gt_margin: s.nota_gt_margin,
      // work (PRS)
      minister, attendance_pct: pr?.attendance_pct ?? null, debates: pr?.debates ?? null,
      questions: pr?.questions ?? null, pmbs: pr?.pmbs ?? null, questions_by_ministry: pr?.questions_by_ministry ?? {},
      // affidavit (MyNeta)
      criminal_cases: mn?.criminal_cases ?? null, total_assets: mn?.total_assets ?? null, total_liabilities: mn?.total_liabilities ?? null,
      // wealth growth (MyNeta recontest)
      assets_2024: w?.assets_2024 ?? null, assets_2019: w?.assets_2019 ?? null, wealth_pct_increase: w?.pct_increase ?? null,
      // MPLADS
      mplads_allocated: mplRow?.allocated ?? null, mplads_expenditure: mplRow?.expenditure ?? null,
      mplads_unspent: mplRow?.unspent ?? null, mplads_utilisation_pct: mplRow?.utilisation_pct ?? null,
      mplads_works_completed: mplRow?.works_completed ?? null, mplads_works_recommended: mplRow?.works_recommended ?? null,
      // party funding (party-level)
      party_bond_total: bond?.bond_total ?? null,
      // score
      accountability_score: score,
    };
  });

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL("mps.json", OUT), JSON.stringify(mps, null, 2));
  await writeFile(new URL("parties.json", OUT), JSON.stringify([...partySeen.values()].sort((a, b) => b.members - a.members), null, 2));

  console.log(`Canonical MPs: ${mps.length}`);
  console.log(`Coverage — PRS ${cov.prs} · Sansad ${cov.sansad} · MyNeta ${cov.myneta} · wealth ${cov.wealth} · MPLADS ${cov.mplads} · bonds ${cov.bonds}`);
  const scored = mps.filter((m) => m.accountability_score != null);
  console.log(`Scored: ${scored.length}; avg ${Math.round(scored.reduce((s, m) => s + (m.accountability_score || 0), 0) / (scored.length || 1))}/100`);
  const worst = scored.sort((a, b) => (a.accountability_score || 0) - (b.accountability_score || 0)).slice(0, 3);
  worst.forEach((m) => console.log(`  low: ${m.mp_name} (${m.pc_name}) score ${m.accountability_score} | att ${m.attendance_pct}% q${m.questions} crim ${m.criminal_cases} mplads ${m.mplads_utilisation_pct}%`));
  console.log(`Parties: ${partySeen.size}`);
  console.log("Wrote data/canonical/mps.json + parties.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
