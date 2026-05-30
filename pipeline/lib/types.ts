export interface Provenance {
  source: string;
  license: string;
  url: string;
}

export interface EciSpineRow {
  pc_id: string;
  eci_state: string;
  eci_pc_no: string;
  pc_name: string;
  pc_name_norm: string;
  reservation: 'SC' | 'ST' | 'GEN';
  winner_name: string;
  winner_party: string;
  winner_party_full: string;
  runner_up_name: string;
  runner_up_party: string;
  margin_votes: number;
  winner_total_votes: number | null;
  winner_vote_share: number | null;
  num_candidates: number;
  nota_votes: number;
  nota_gt_margin: boolean;
  valid_votes: number | null;
  status: string;
  _provenance: Provenance;
}

export interface PrsRow {
  name: string;
  name_norm: string;
  constituency: string;
  constituency_norm: string;
  state: string;
  party: string;
  minister: boolean;
  attendance_pct: number | null;
  debates: number | null;
  questions: number | null;
  pmbs: number | null;
  terms: number | null;
  age: number | null;
  gender: string;
  education: string;
  questions_by_ministry: Record<string, number>;
  reported: boolean;
  _provenance: Provenance;
}
