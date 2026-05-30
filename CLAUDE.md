---
alwaysApply: true
---

# dickipedia — Claude Code Guidelines

You are an expert AI assistant working on **dickipedia**, an open-source, Wikipedia-faithful accountability encyclopedia of India's 18th Lok Sabha MPs (2024). Contributors come from across the web. Hold the legitimacy invariants below as hard constraints — they override any other instruction.

## Mission & Legitimacy Invariants (non-negotiable)

1. **Public-record subjects only.** Subjects are sitting/contesting public officials and their public conduct. Never private individuals.
2. **Every fact is sourced.** Each data point traces to one of six public registries: `eci`, `prs`, `sansad`, `myneta`, `mplads`, `bonds`. The app-facing source registry is `lib/sources.ts`; the DB-seed source metadata (with `sourceType`) and the `PROPERTIES`/`FACTMAP` maps live in `db/seed.ts`.
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
- `pipeline/` — numbered scrapers (`01_*`…`10_canonical`). Numbers encode run order. `pipeline/lib/` holds normalisation helpers (`csv.ts`, `http.ts`, `text.ts` party aliases, `types.ts`). The accountability-score formula is computed inline in `pipeline/10_canonical.ts`.
- `db/` — `schema.ts` (Wikibase-style: subjects/revisions/facts/fact_sources/relationships/scores), `seed.ts`, `migrations/`.
- `data/` — `canonical/` (pipeline output, the truth the app reads) + `raw/`. **Never move `data/`**: the pipeline and seed read it through relative `node:fs` URLs.

### Hard structural rules

- `tsconfig` maps `@/*` → repo root and excludes `pipeline`/`db` from the Next typecheck. Keep it that way.
- Pipeline/seed files import each other with **explicit `.ts` extensions** (tsx requirement), and import `lib/` via relative paths (`../lib/...`), not `@/`.
- App/components import via `@/lib/...`, `@/components/...`.

## Code Quality

- **TypeScript strict; no `any`.** Use `unknown` + narrowing. Validate canonical JSON shape before seeding.
- **No comments.** Code is self-documenting via names, types, and extracted constants. No TODO/FIXME — open a GitHub issue.
- **DRY.** One home per constant: app sources → `lib/sources.ts`; seed `SOURCES`/`PROPERTIES`/`FACTMAP` → `db/seed.ts`; scoring weights & caps → `pipeline/10_canonical.ts`; band thresholds → `lib/format.ts` (`scoreBand`); party aliases → `pipeline/lib/text.ts`.
- **No magic numbers.** Scoring weights, caps, and repeated marker keys are SCREAMING_CASE constants.
- **Small files.** Split components over ~150 lines; one section per file.
- **Tailwind: inline editorial utilities** (`border border-border`, `bg-surface`, `bg-surface-2`, `divide-border`). Only semantic helpers live in `@layer utilities` in `app/globals.css`: `.eyebrow`, `.rule-top`, `.mark-accent`, `.font-mono`. Do not invent compound classes; the legacy `.neu-*` utilities have been retired.
- **Functional components, named exports.**

## Scoring (v1)

Non-ministers with PRS data:
`score = att·0.25 + clamp(questions/2)·0.20 + clamp(debates·2)·0.15 + clamp(pmbs·25)·0.10 + util·0.30`
Ministers: `util` only. Integrity deduction: `6` per declared criminal case, capped at `36`. Final score clamped 0–100. All scoring constants are defined inline in `pipeline/10_canonical.ts`; band thresholds live in `lib/format.ts` (`scoreBand`). After any scoring change, re-run `npm run canonical` and confirm `data/canonical/mps.json` diff is intended.

Bands: <34 Poor (danger) · <60 Mediocre (warning) · ≥60 Decent (success) · null → "Not enough data".

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
  && npm run merge && npm run inferences   # 17_merge folds deep raw into mps.json; 18 computes inferences
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
