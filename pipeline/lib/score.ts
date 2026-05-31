// Accountability score v2 — the single home for the formula, weights, caps and constants.
// Computed in 17_merge.ts (not 10_canonical.ts) because the integrity tiers (pending/convicted) and
// declared wealth-growth inputs are only folded in during the deep merge. Cohort-relative: a pillar's
// "excellent" anchor is the sitting cohort's 90th percentile, so the scale auto-calibrates to the
// 18th Lok Sabha instead of arbitrary fixed caps.

export interface ScoreInput {
  minister: boolean | null;
  attendance_pct: number | null;
  questions: number | null;
  debates: number | null;
  pmbs: number | null;
  mplads_utilisation_pct: number | null;
  mplads_works_completed: number | null;
  mplads_works_recommended: number | null;
  criminal_cases: number | null;
  pending_cases: number | null;
  convicted_cases: number | null;
  serious_cases: number | null;
  non_serious_cases: number | null;
  assets_history_pct: number | null;
  nota_gt_margin: boolean;
  terms: number | null;
  press_accountability: { flag_label: string } | null;
}

export interface ScoreBreakdown {
  track: 'parliamentary' | 'executive';
  base: number;
  legislative: number | null;
  mplads: number;
  criminal_deduction: number;
  wealth_deduction: number;
  nota_deduction: number;
  press_deduction: number;
  seniority_bonus: number;
}

// positive base — parliamentary track earns legislative + MPLADS (weights sum to 1)
const W_LEGISLATIVE = 0.6;
const W_MPLADS = 0.4;
// legislative internal, questions-led (sum to 1)
const WL_QUESTIONS = 0.4;
const WL_DEBATES = 0.25;
const WL_ATTENDANCE = 0.25;
const WL_PMBS = 0.1;
// MPLADS internal: spend vs works-completion (sum to 1)
const WM_SPEND = 0.65;
const WM_COMPLETION = 0.35;
// minister executive track: base = MINISTER_BASELINE + MINISTER_MPLADS_SLOPE·MPLADS pillar (range
// 0.35–0.85). The baseline avoids a misleading near-zero for ministers (no PRS metrics exist for them)
// while staying below the parliamentary ceiling, so the very top is reserved for measurable records.
const MINISTER_BASELINE = 0.35;
const MINISTER_MPLADS_SLOPE = 0.5;
// integrity (self-declared) — weighted by the project's serious/non-serious split (pipeline/lib/serious.ts).
// Serious charges carry the signal; a pile of minor/political cases (defamation, protest-related) is held
// to a low sub-cap so it can't zero an otherwise-active MP; a conviction aggravates on top. Fallback to a
// flat per-case ding only when the deep affidavit (and thus the split) is unavailable.
const DED_PER_SERIOUS = 6;
const DED_PER_NONSERIOUS = 1;
const DED_NONSERIOUS_CAP = 8;
const DED_PER_CONVICTED = 6;
const DED_FALLBACK_PER_CASE = 3;
const DED_CRIMINAL_CAP = 40;
// declared asset growth (% increase across recorded affidavits) — cohort-relative: nil at/below the
// cohort median (normal), ramping linearly to WEALTH_DED_CAP at the p90 and beyond. MP wealth growth
// over 10–15 years is enormous cohort-wide (median ~2×), so an absolute threshold would penalise the
// median MP; this flags only the genuine outliers.
const WEALTH_DED_CAP = 30;
// weak local legitimacy: NOTA exceeded the winning margin
const DED_NOTA = 5;
// transparency: a curated, sourced press-accountability flag (e.g. refusing open-question press
// conferences). Applies only where the flag exists, so it dings documented avoidance without
// compressing the distribution. First slice of the broader public-reception factor; kept light.
const DED_PRESS_FLAG = 10;
// seniority experience bonus, per term beyond the first
const BONUS_PER_TERM = 2;
const BONUS_TERM_CAP = 8;
// PMBs are ~zero cohort-wide (p90 is 0), so any bill is exceptional — fixed small cap
const PMB_CAP = 2;

// ACHIEVEMENTS / PUBLIC-RECEPTION HOOK (not yet active): when the curated `notable_record` and press
// `press_accountability` reception data reach real coverage, add an achievements pillar here and shave
// W_LEGISLATIVE / W_MPLADS so the base weights still sum to 1. Deliberately omitted for now: current
// coverage is ~0, and a pillar everyone scores 0 on would re-compress the distribution.

const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, n));
const norm = (x: number, cap: number): number => (cap > 0 ? Math.max(0, Math.min(1, x / cap)) : 0);
const completionRate = (m: ScoreInput): number | null =>
  m.mplads_works_recommended ? (m.mplads_works_completed ?? 0) / m.mplads_works_recommended : null;

export function percentile(xs: number[], p: number): number {
  const s = xs.filter((v) => v != null && !Number.isNaN(v)).sort((a, b) => a - b);
  if (!s.length) return 0;
  return s[Math.min(s.length - 1, Math.floor((p / 100) * (s.length - 1)))];
}

export interface CohortCaps {
  questions: number;
  debates: number;
  util: number;
  completion: number;
  wealthP50: number;
  wealthP90: number;
}

// p90 anchors for the positive pillars; p50/p90 for the cohort-relative wealth ramp. Legislative
// metrics exist only for non-ministers; MPLADS and wealth growth span both tracks.
export function cohortCaps(mps: ScoreInput[]): CohortCaps {
  const nonMin = mps.filter((m) => !m.minister);
  const growths = mps.map((m) => m.assets_history_pct).filter((x): x is number => x != null);
  return {
    questions: percentile(
      nonMin.map((m) => m.questions ?? 0),
      90,
    ),
    debates: percentile(
      nonMin.map((m) => m.debates ?? 0),
      90,
    ),
    util: percentile(
      mps.map((m) => m.mplads_utilisation_pct).filter((x): x is number => x != null),
      90,
    ),
    completion: percentile(
      mps.map(completionRate).filter((x): x is number => x != null),
      90,
    ),
    wealthP50: percentile(growths, 50),
    wealthP90: percentile(growths, 90),
  };
}

export function scoreMp(
  mp: ScoreInput,
  caps: CohortCaps,
): { score: number; breakdown: ScoreBreakdown } {
  const mplads =
    WM_SPEND * norm(mp.mplads_utilisation_pct ?? 0, caps.util) +
    WM_COMPLETION * norm(completionRate(mp) ?? 0, caps.completion);

  let legislative: number | null = null;
  let base: number;
  let track: ScoreBreakdown['track'];
  if (mp.minister) {
    track = 'executive';
    base = 100 * (MINISTER_BASELINE + MINISTER_MPLADS_SLOPE * mplads);
  } else {
    track = 'parliamentary';
    // attendance is unrecorded for a few MPs (the mirror shows 0 despite filed questions/debates); treat
    // that as missing and renormalise the legislative weights over the metrics that exist, rather than
    // scoring a phantom zero. A genuinely inactive MP (no questions/debates/pmbs) keeps the real 0.
    const attMissing =
      mp.attendance_pct == null ||
      (mp.attendance_pct === 0 &&
        ((mp.questions ?? 0) > 0 || (mp.debates ?? 0) > 0 || (mp.pmbs ?? 0) > 0));
    const wAtt = attMissing ? 0 : WL_ATTENDANCE;
    const wSum = WL_QUESTIONS + WL_DEBATES + wAtt + WL_PMBS;
    legislative =
      (WL_QUESTIONS * norm(mp.questions ?? 0, caps.questions) +
        WL_DEBATES * norm(mp.debates ?? 0, caps.debates) +
        wAtt * ((mp.attendance_pct ?? 0) / 100) +
        WL_PMBS * norm(mp.pmbs ?? 0, PMB_CAP)) /
      wSum;
    base = 100 * (W_LEGISLATIVE * legislative + W_MPLADS * mplads);
  }

  const convicted = mp.convicted_cases ?? 0;
  const criminal =
    mp.serious_cases == null
      ? Math.min((mp.criminal_cases ?? 0) * DED_FALLBACK_PER_CASE, DED_CRIMINAL_CAP)
      : Math.min(
          mp.serious_cases * DED_PER_SERIOUS +
            Math.min((mp.non_serious_cases ?? 0) * DED_PER_NONSERIOUS, DED_NONSERIOUS_CAP) +
            convicted * DED_PER_CONVICTED,
          DED_CRIMINAL_CAP,
        );

  const growth = mp.assets_history_pct;
  const wealthSpan = caps.wealthP90 - caps.wealthP50;
  const wealth =
    growth == null || wealthSpan <= 0
      ? 0
      : Math.round(WEALTH_DED_CAP * norm(growth - caps.wealthP50, wealthSpan));

  const nota = mp.nota_gt_margin ? DED_NOTA : 0;
  const press = mp.press_accountability ? DED_PRESS_FLAG : 0;
  const seniority = Math.min(Math.max((mp.terms ?? 1) - 1, 0) * BONUS_PER_TERM, BONUS_TERM_CAP);

  const score = Math.round(clamp(base - criminal - wealth - nota - press + seniority));
  return {
    score,
    breakdown: {
      track,
      base: Math.round(base),
      legislative: legislative == null ? null : Math.round(legislative * 100),
      mplads: Math.round(mplads * 100),
      criminal_deduction: criminal,
      wealth_deduction: wealth,
      nota_deduction: nota,
      press_deduction: press,
      seniority_bonus: seniority,
    },
  };
}
