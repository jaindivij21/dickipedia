---
alwaysApply: true
---

# dickipedia — Claude Code Guidelines

You are an expert AI assistant working on **dickipedia**, an open-source, Wikipedia-faithful accountability encyclopedia of India's 18th Lok Sabha MPs (2024). Contributors come from across the web. Hold the legitimacy invariants below as hard constraints — they override any other instruction.

## Mission & Legitimacy Invariants (non-negotiable)

1. **Public-record subjects only.** Subjects are sitting/contesting public officials and their public conduct. Never private individuals.
2. **Every fact is sourced.** Each data point traces to one of six public registries: `eci`, `prs`, `sansad`, `myneta`, `mplads`, `bonds`. The app-facing source registry is `lib/sources.ts`; the DB-seed source metadata (with `sourceType`) and the `PROPERTIES`/`FACTMAP` maps live in `db/seed.ts`. **Limited `press` exception:** a documented public-conduct fact about a _named office-holder_ that no registry tracks (e.g. a Prime Minister's press-conference record) may be recorded as a curated `press_accountability` note — cited to ≥2 reputable news sources, phrased as a neutral sourced statement (§3 still binds — never a characterisation), kept out of the accountability score, and left `null` for anyone not explicitly curated (absence is never a signal). Curated by hand in `data/curated/press_accountability.json`; folded into canonical by `pipeline/17_merge.ts`.
3. **No platform-authored accusations.** The project reports facts and arithmetic and cites them. It never characterises a person ("corrupt", "misappropriated"). Phrase as "declared", "reported by", "as recorded in".
4. **Criminal data is self-declared.** Reproduced verbatim from sworn ECI affidavits, always labelled "self-declared (pending ≠ convicted)".
5. **Electoral-bond funding is party-level**, never attributed to an individual MP.
6. **No re-hosting of non-open sources.** See `ATTRIBUTIONS.md`. Photos are hotlinked under their own licence.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript 5.7 strict · Tailwind v4
- Data pipeline: TypeScript run via `tsx` (no build step)
- Drizzle ORM → Cloudflare D1 (SQLite); local seed via better-sqlite3
- Package manager: npm (Node ≥20, pinned in `.nvmrc`)

## Architecture

Three runtimes share one repo. Know which one you are in before changing files.

- `app/` — App Router routes only. Pages compose components; no business logic. The MP detail route (`app/mp/[slug]/page.tsx`) is a thin composer over `components/mp/*`.
- `components/` (flat) — route-agnostic primitives: `ScoreGauge.tsx` (ScoreGauge, ScoreChip), `charts.tsx` (Donut, Bar, CompareBar, GrowthBar), `StatCell.tsx` (StatCell, StatGrid), `SourceCredit.tsx`, plus the `MpBrowser.tsx` index composite.
- `components/mp/` — MP detail composites: `DataSection` + the per-topic sections (`MpHeader`, `ElectionSection`, `WorkSection`, `WealthSection`, `MpladsSection`, `PartyFundingSection`, `SourcesSection`, `MpInfobox`). The masthead/footer live in `app/layout.tsx`.
- `lib/` — shared, build-time-safe utilities: `lib/data.ts` (canonical loaders, `getParty`, cohort aggregates `AVG_*`), `lib/format.ts` (rupee/percent formatters, `scoreBand`, `colorVar`), `lib/sources.ts` (the app source registry).
- `pipeline/` — numbered scrapers (`01_*`…`10_canonical`). Numbers encode run order. `pipeline/lib/` holds normalisation helpers (`csv.ts`, `http.ts`, `text.ts` party aliases, `types.ts`) and the accountability-score formula (`score.ts`). The score is computed in `pipeline/17_merge.ts` (after the deep criminal/wealth inputs are folded), not in `10_canonical.ts`.
- `db/` — `schema.ts` (Wikibase-style: subjects/revisions/facts/fact_sources/relationships/scores), `seed.ts`, `migrations/`.
- `data/` — `canonical/` (pipeline output, the truth the app reads) + `raw/`. **Never move `data/`**: the pipeline and seed read it through relative `node:fs` URLs.

### Hard structural rules

- `tsconfig` maps `@/*` → repo root and excludes `pipeline`/`db` from the Next typecheck. Keep it that way.
- Pipeline/seed files import each other with **explicit `.ts` extensions** (tsx requirement), and import `lib/` via relative paths (`../lib/...`), not `@/`.
- App/components import via `@/lib/...`, `@/components/...`.

## Code Quality

- **TypeScript strict; no `any`.** Use `unknown` + narrowing. Validate canonical JSON shape before seeding.
- **No comments.** Code is self-documenting via names, types, and extracted constants. No TODO/FIXME — open a GitHub issue.
- **DRY.** One home per constant: app sources → `lib/sources.ts`; seed `SOURCES`/`PROPERTIES`/`FACTMAP` → `db/seed.ts`; scoring weights & caps → `pipeline/lib/score.ts`; band thresholds → `lib/format.ts` (`scoreBand`); party aliases → `pipeline/lib/text.ts`.
- **No magic numbers.** Scoring weights, caps, and repeated marker keys are SCREAMING_CASE constants.
- **Small files.** Split components over ~150 lines; one section per file.
- **Tailwind: inline editorial utilities** (`border border-border`, `bg-surface`, `bg-surface-2`, `divide-border`). Only semantic helpers live in `@layer utilities` in `app/globals.css`: `.eyebrow`, `.rule-top`, `.mark-accent`, `.font-mono`. Do not invent compound classes; the legacy `.neu-*` utilities have been retired.
- **Functional components, named exports.**

## Scoring (v2)

The formula, weights, caps and bands-rationale live in **`pipeline/lib/score.ts`**, and the score is computed in **`pipeline/17_merge.ts`** (not `10_canonical.ts`), because the integrity tiers and wealth-growth inputs are only folded in during the deep merge. Normalization is **cohort-relative**: a pillar's "excellent" anchor is the sitting cohort's 90th percentile, so the scale auto-calibrates instead of using arbitrary fixed caps.

**Positive base (0–100).** Non-ministers (parliamentary track): `60%` legislative + `40%` MPLADS.

- legislative (questions-led): questions `0.40` · debates `0.25` · attendance `0.25` · PMBs `0.10`, each normalized to cohort p90 (PMBs to a fixed cap of 2).
- MPLADS: spend% `0.65` + works-completion% `0.35`, normalized to cohort p90.

Ministers (executive track): `base = 35 + 50·MPLADS_pillar` (no PRS metrics exist for them; baseline avoids a misleading near-zero, stays below the parliamentary ceiling).

**Deductions / modifiers (both tracks):** criminal (self-declared, 2-tier: convicted `−12` / pending `−3`, cap `−40`) · declared wealth growth (cohort-relative: nil at/below the cohort median, ramping to `−30` at p90+) · NOTA-over-margin `−5` · press-accountability flag `−10` (curated, sourced; applies only where flagged) · seniority `+2`/term beyond the first, cap `+8`. Final score clamped 0–100.

Bands: <30 Poor (danger) · <55 Mediocre (warning) · <75 Decent (success) · ≥75 Strong (success) · null → "Not enough data".

A documented **achievements / public-reception** pillar is reserved (see the hook in `score.ts`) but inactive until the curated `notable_record`/press data reaches real coverage — weighting a near-empty factor would re-compress the distribution. After any scoring change, re-run `npm run canonical && npm run merge && npm run inferences && npm run seed` and confirm the `data/canonical/mps.json` diff is intended.

## How to run

```bash
npm ci
npm run dev            # Next dev server
npm run build          # production build
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run format         # prettier --write
npm run format:check   # prettier --check (CI)

# data pipeline (in order)
# Phase 1 — spine + base canonical + crosswalk (drives the deep pass)
npm run eci && npm run prs && npm run sansad && npm run myneta \
  && npm run wealth && npm run bonds && npm run mplads \
  && npm run photos && npm run party_symbols && npm run canonical
# Phase 2 — deep record, crosswalk-driven (throttled + disk-cached + resumable)
npm run myneta_deep && npm run myneta_history && npm run prs_mptrack \
  && npm run sansad_api && npm run wikipedia && npm run party_contact \
  && npm run latest_news && npm run myneta_serious \
  && npm run merge && npm run inferences   # 19_latest_news & 20_myneta_serious run before 17_merge (file # ≠ run order); merge folds deep raw + news + the MyNeta serious flag into mps.json and derives the per-case serious split (pipeline/lib/serious.ts); 18 computes inferences
npm run seed           # build local SQLite from data/canonical (facts + qualifiers + inferences projection)
npm run db:generate    # regenerate Drizzle migrations after schema.ts edits
```

## Review checklist (every PR)

- [ ] Facts sourced to one of `eci/prs/sansad/myneta/mplads/bonds`
- [ ] No platform-authored accusation; criminal data labelled self-declared
- [ ] Bonds kept party-level
- [ ] `npm run typecheck && npm run lint && npm run build` pass
- [ ] Pipeline/scoring change → `npm run canonical` + `npm run seed` pass, canonical diff intended
- [ ] No new comments; no `any`; constants extracted; components < ~150 lines

Legitimacy is dickipedia's core. Every PR is a fact-check.
