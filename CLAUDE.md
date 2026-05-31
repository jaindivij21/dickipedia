---
alwaysApply: true
---

# dickipedia — Claude Code Guidelines

You are an expert AI assistant working on **dickipedia**, an open-source, sourced **accountability
encyclopedia of public power** — Wikipedia-like, but different: not a place where anyone can write
anything. Every entry is a **public office-holder**, every figure traces to a **public registry**,
and the platform reports facts and arithmetic and cites them — it authors no accusations.

**Volume I is the 543 members of India's 18th Lok Sabha (2024).** The platform is built **generically**
so future volumes (other categories of public office-holders) reuse the same engine, primitives, and
sourcing rules. MPs are the first subject type, not the whole product. Hold the legitimacy invariants
below as hard constraints — they override any other instruction.

## Mission & Legitimacy Invariants (non-negotiable)

1. **Public-record subjects only.** Subjects are sitting/contesting public officials and their public conduct. Never private individuals.
2. **Every fact is sourced.** Each data point traces to one of six public registries: `eci`, `prs`, `sansad`, `myneta`, `mplads`, `bonds`. The app-facing source registry is `lib/sources.ts` (loading `data/config/sources.json`). **Limited `press` exception:** a documented public-conduct fact about a _named office-holder_ that no registry tracks (e.g. a Prime Minister's press-conference record) may be recorded as a curated `press_accountability` note — cited to ≥2 reputable news sources, phrased as a neutral sourced statement (§3 still binds — never a characterisation), kept out of the accountability score, and left `null` for anyone not explicitly curated (absence is never a signal). Curated by hand in `data/curated/press_accountability.json`; folded into canonical by `pipeline/17_merge.ts`.
3. **No platform-authored accusations.** The project reports facts and arithmetic and cites them. It never characterises a person ("corrupt", "misappropriated"). Phrase as "declared", "reported by", "as recorded in".
4. **Self-declared data is labelled as such.** Criminal data is reproduced verbatim from sworn ECI affidavits, always labelled "self-declared (pending ≠ convicted)".
5. **Electoral-bond funding is party-level**, never attributed to an individual office-holder.
6. **No re-hosting of non-open sources.** See `ATTRIBUTIONS.md`. Photos are hotlinked under their own licence.

## Stack

- Next.js 16 (App Router, **static export**) · React 19 · TypeScript 5.7 strict · Tailwind v4
- **JSON-only — no database at runtime.** The app reads pre-computed JSON from `data/canonical/`.
- Data pipeline: TypeScript run via `tsx` (no build step), output committed as JSON.
- Package manager: npm (Node pinned in `.nvmrc`). Commits follow Conventional Commits (commitlint).

## Architecture

Two runtimes share one repo: the **app** (App Router + components + app-side `lib/`) and the
**pipeline** (`tsx` scripts). Know which one you are in before changing files. Generic, reusable code
lives outside the volume folders; only subject-specific content lives in a volume folder (`mp/`).

- `app/` — App Router routes only. Pages compose components; no business logic. The MP detail route (`app/mp/[slug]/page.tsx`) is a thin composer; it loads one subject via `lib/mp/loader.ts`.
- `components/ui/` — **generic** primitives: `DataSection` (the section frame), `Badge`, `EmptyState`, `InfoRow`, `LastUpdated`, `StatCell`, `ScoreGauge`, `Portrait`, `PartySymbol`, `SourceCredit`.
- `components/charts/` — **generic** chart primitives (`Donut`, `Bar`/`CompareBar`, `BarList`, `GrowthBar`, `WealthTimeSeries`) via an `index.ts` barrel (`@/components/charts`).
- `components/mp/` — **MP-volume** components: the per-topic sections (`MpHeader`, `ElectionSection`, `WorkSection`, `WealthSection`, `MpladsSection`, `AffidavitSection`, `PartyFundingSection`, `InferencesSection`, `ContactSection`, `NewsSection`, `SourcesSection`, `MpInfobox`, `MpLede`) plus `browse/` (the index browser), `affidavit/`, and `work/`. The masthead/footer live in `app/layout.tsx`.
- `lib/` — **generic** app utilities: `lib/format.ts` (formatters, `scoreBand` reading `data/config/score-bands.json`, `colorVar`, `fmtDate`), `lib/sources.ts` (source registry over `data/config/sources.json`).
- `lib/mp/` — **MP-volume** data layer: `types.ts` (the `Mp`/`SlimMp`/`Party` + detail types), `data.ts` (index/manifest loaders, `getParty`, cohort aggregates `AVG_*`, `featuredMp`), `loader.ts` (`loadMp`, server-only `fs` read), `bio.ts`, `constants.ts` (MP UI constants + filter types), `filter.ts` (the browse hook).
- `pipeline/` — numbered scrapers (`01_*`…`20_*`); **the ingestion engine** `registry.ts` (source → script → cadence → feeds-score) + `ingest.ts` (the runner). `pipeline/lib/` holds normalisation helpers (`csv.ts`, `http.ts`, `text.ts` party aliases + banned-word guard, `money.ts`, `serious.ts`, `reservation.ts`, `stamp.ts`) and the accountability-score formula (`score.ts`). The score is computed in `pipeline/17_merge.ts` (after deep criminal/wealth inputs fold in); `18_inferences.ts` appends inferences; `21_publish.ts` emits the per-subject files + index + manifest; `assert_canonical.ts` validates.
- `data/` — `canonical/` (the truth the app reads: `mp/<slug>.json` per subject + `index.json` slim list/aggregates + `parties.json` + `manifest.json` timestamps; `mps.json` is a gitignored intermediate) · `raw/` (committed scraper outputs + the `_fetched.json` timestamp sidecar) · `config/` (`sources.json`, `score-bands.json`) · `curated/` (hand-curated sourced facts) · `cache/` (gitignored HTTP cache). **Never move `data/`**: the pipeline reads it through relative `node:fs` URLs.

### Hard structural rules

- `tsconfig` maps `@/*` → repo root and excludes `pipeline` from the Next typecheck. Keep it that way.
- Pipeline files import each other with **explicit `.ts` extensions** (tsx requirement) and import `pipeline/lib/` via relative paths, not `@/`.
- App/components/app-`lib` import via `@/...`.
- **Generic stays generic.** `components/ui`, `components/charts`, `lib/format`, `lib/sources` must not import from a volume folder (`components/mp`, `lib/mp`). Volume-specific code lives only in those volume folders. New volumes add sibling folders.

## Code Quality

- **TypeScript strict; no `any`.** Use `unknown` + narrowing. Validate canonical JSON shape before use.
- **No comments.** Code is self-documenting via names, types, and extracted constants. Only `// @note` / `// @todo` are allowed. No TODO/FIXME prose — open a GitHub issue.
- **DRY.** One home per constant: app sources → `lib/sources.ts` + `data/config/sources.json`; scoring weights & caps → `pipeline/lib/score.ts`; band thresholds → `data/config/score-bands.json` (read by `lib/format`'s `scoreBand` and the browse legend — never hard-code bands again); MP UI constants → `lib/mp/constants.ts`; party aliases → `pipeline/lib/text.ts`; ingestion source list → `pipeline/registry.ts`.
- **No magic numbers.** Scoring weights, caps, and repeated marker keys are SCREAMING_CASE constants.
- **Small files.** Split components over ~150 lines; one section per file.
- **Tailwind: inline editorial utilities** (`border border-border`, `bg-surface`, `bg-surface-2`, `divide-border`). Only semantic helpers live in `@layer utilities` in `app/globals.css`: `.eyebrow`, `.rule-top`, `.mark-accent`, `.font-mono`. Do not invent compound classes.
- **Functional components, named exports.** Conventional Commits (a commit hook enforces it).

## Scoring (v2)

The formula, weights, caps and constants live in **`pipeline/lib/score.ts`**, and the score is computed in **`pipeline/17_merge.ts`** (not `10_canonical.ts`), because the integrity tiers and wealth-growth inputs are only folded in during the deep merge. Normalization is **cohort-relative**: a pillar's "excellent" anchor is the sitting cohort's 90th percentile, so the scale auto-calibrates instead of using arbitrary fixed caps. The display bands live in `data/config/score-bands.json`.

**Positive base (0–100).** Non-ministers (parliamentary track): `60%` legislative + `40%` MPLADS.

- legislative (questions-led): questions `0.40` · debates `0.25` · attendance `0.25` · PMBs `0.10`, each normalized to cohort p90 (PMBs to a fixed cap of 2).
- MPLADS: spend% `0.65` + works-completion% `0.35`, normalized to cohort p90.

Ministers (executive track): `base = 100·(0.35 + 0.5·MPLADS_pillar)` (no PRS metrics exist for them; baseline avoids a misleading near-zero, stays below the parliamentary ceiling).

**Deductions / modifiers (both tracks):** criminal (self-declared: serious `−6` each · non-serious `−1` each, sub-cap `−8` · convicted `−6` each; fallback `−3`/case when the deep split is unavailable; overall cap `−40`) · declared wealth growth (cohort-relative: nil at/below the cohort median, ramping to `−30` at p90+) · NOTA-over-margin `−5` · press-accountability flag `−10` (curated, sourced; applies only where flagged) · seniority `+2`/term beyond the first, cap `+8`. Final score clamped 0–100.

Bands (`data/config/score-bands.json`): <30 Poor (danger) · <55 Mediocre (warning) · <75 Decent (success) · ≥75 Strong (success) · null → "Not enough data".

A documented **achievements / public-reception** pillar is reserved (see the hook in `score.ts`) but inactive until the curated `notable_record`/press data reaches real coverage. After any scoring change, run `npm run rebuild && npm run assert:canonical` and confirm the `data/canonical` diff is intended.

## How to run

```bash
npm ci
npm run dev            # Next dev server
npm run build          # static export → out/
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run format:check   # prettier --check (CI)

# data — the ingestion engine (source list lives in pipeline/registry.ts)
npm run ingest -- --cadence monthly      # fast feeds: PRS activity + news
npm run ingest -- --cadence semiannual   # full re-crawl of every source
npm run ingest -- --sources mplads,bonds # an arbitrary subset
# a single source can also be run directly, e.g. npm run prs / npm run mplads

# deterministic recompute + validate (no network)
npm run rebuild          # canonical → merge → inferences → publish
npm run assert:canonical # 543 subjects, identity + coverage floors, manifest present
```

Scheduled refresh runs on GitHub Actions (`.github/workflows/data-{monthly,semiannual,dispatch}.yml`),
which call `npm run ingest`, rebuild, validate, and **auto-commit** the refreshed JSON.

## Review checklist (every PR)

- [ ] Facts sourced to a public registry (`eci/prs/sansad/myneta/mplads/bonds`, or curated `press`)
- [ ] No platform-authored accusation; self-declared data labelled as such; bonds kept party-level
- [ ] `npm run typecheck && npm run lint && npm run format:check && npm run build` pass
- [ ] Pipeline/scoring change → `npm run rebuild` + `npm run assert:canonical` pass, `data/canonical` diff intended; a new source is registered in `pipeline/registry.ts`
- [ ] Generic code kept out of volume folders; subject-specific code stays in `components/mp` / `lib/mp`
- [ ] No new comments; no `any`; constants extracted; components < ~150 lines; Conventional Commit message

Legitimacy is dickipedia's core. Every PR is a fact-check.
