import mpsJson from "@/data/canonical/mps.json";

export interface Mp {
  pc_id: string; pc_name: string; eci_state: string; reservation: string;
  mp_name: string; party: string; party_full: string;
  mpsno: number | null; gender: string | null; age: number | null; dob: string | null;
  profession: string | null; qualification: string | null; terms: number | null;
  email: string | null; phone: string | null; photo_hotlink: string | null; profile_url: string | null;
  margin_votes: number; winner_vote_share: number | null; runner_up_name: string; runner_up_party: string;
  num_candidates: number; nota_votes: number; nota_gt_margin: boolean;
  minister: boolean | null; attendance_pct: number | null; debates: number | null;
  questions: number | null; pmbs: number | null; questions_by_ministry: Record<string, number>;
  criminal_cases: number | null; total_assets: number | null; total_liabilities: number | null;
  assets_2024: number | null; assets_2019: number | null; wealth_pct_increase: number | null;
  mplads_allocated: number | null; mplads_expenditure: number | null; mplads_unspent: number | null;
  mplads_utilisation_pct: number | null; mplads_works_completed: number | null; mplads_works_recommended: number | null;
  party_bond_total: number | null;
  accountability_score: number | null;
}

export const slugify = (s: string) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const mpSlug = (m: Mp) => `${slugify(m.mp_name)}-${slugify(m.pc_name)}`;

export const ALL_MPS: Mp[] = (mpsJson as Mp[]);

const BY_SLUG = new Map(ALL_MPS.map((m) => [mpSlug(m), m]));
export const getMp = (slug: string) => BY_SLUG.get(slug);
export const allSlugs = () => [...BY_SLUG.keys()];

export interface SlimMp {
  slug: string; name: string; pc: string; state: string; party: string; party_full: string;
  score: number | null; photo: string | null; attendance: number | null; criminal: number | null;
  mplads_util: number | null; nota_gt_margin: boolean; assets: number | null; minister: boolean | null;
}
export const toSlim = (m: Mp): SlimMp => ({
  slug: mpSlug(m), name: m.mp_name, pc: m.pc_name, state: m.eci_state, party: m.party, party_full: m.party_full,
  score: m.accountability_score, photo: m.photo_hotlink, attendance: m.attendance_pct, criminal: m.criminal_cases,
  mplads_util: m.mplads_utilisation_pct, nota_gt_margin: m.nota_gt_margin, assets: m.total_assets, minister: m.minister,
});

export const states = () => [...new Set(ALL_MPS.map((m) => m.eci_state))].sort();
export const parties = () =>
  [...new Set(ALL_MPS.map((m) => m.party))].filter(Boolean).sort((a, b) =>
    ALL_MPS.filter((m) => m.party === b).length - ALL_MPS.filter((m) => m.party === a).length);
