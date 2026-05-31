# dickipedia

**An open, sourced encyclopedia of public power.** Wikipedia-like, but different: it is not a place
where anyone can write anything. Every entry is a **public office-holder**, every figure traces to a
**public registry**, and the platform reports facts and the arithmetic on them — it authors **no
accusations**, and routes citizens to lawful channels.

> **Volume I — the 543 members of India's 18th Lok Sabha (2024).** The platform is built generically:
> future volumes (other categories of public office-holders) extend the same engine, primitives, and
> sourcing rules. MPs are simply the first subject type.

## Principles (non-negotiable)

1. **Public-record subjects only** — sitting/contesting public officials and their public conduct, never private individuals.
2. **Every fact is sourced** to a public registry; nothing is asserted without a citation.
3. **No platform-authored accusations** — facts are _declared / reported / as recorded_, never characterised.
4. **Self-declared data is labelled as such** (e.g. criminal cases from sworn affidavits: "pending ≠ convicted").
5. **No re-hosting of non-open sources** — see [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md). Photos are hotlinked under their own licence.

## How it works

dickipedia is a **JSON-only, statically-exported frontend** — there is no database at runtime.

```
public registries ──(pipeline scrapers)──▶ data/raw/*.json
                                              │  (deterministic recompute)
                                              ▼
                          data/canonical/  (per-subject files + slim index + manifest)
                                              │  (read at build time)
                                              ▼
                              Next.js static export  ──▶  any CDN / static host
```

- The **pipeline** (`pipeline/*.ts`, run via `tsx`) ingests each public registry into `data/raw/`.
- A deterministic **rebuild** (`canonical → merge → inferences → publish`) turns raw data into the
  per-subject JSON the app reads, with precomputed cohort aggregates and a timestamp manifest.
- **GitHub Actions crons** schedule the ingestion and **auto-commit** refreshed JSON; a push triggers a redeploy.

## Quick start

```bash
npm ci
npm run dev            # local dev server
npm run build          # static export → out/
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run format:check   # prettier --check
```

## Data pipeline & refresh

The source list lives in one place — `pipeline/engine/registry.ts` (each source's `run`, cadence, and
whether it feeds the accountability score). The engine runs them:

```bash
npm run ingest -- --cadence monthly      # fast feeds (parliamentary activity, news)
npm run ingest -- --cadence semiannual   # full re-crawl of every source
npm run ingest -- --sources mplads,bonds # an arbitrary subset
npm run rebuild                          # canonical → merge → inferences → publish
npm run assert:canonical                 # validate the published output
```

Scheduled refresh is handled by GitHub Actions (`.github/workflows/data-*.yml`); a manual
`workflow_dispatch` can re-pull any single source.

## Project structure

```
app/            Next.js App Router (routes compose components; no business logic)
components/
  ui/           generic primitives (Badge, DataSection, StatCell, Portrait, ScoreGauge, …)
  charts/       generic chart primitives
  mp/           MP-volume components (sections, browse/, affidavit/, work/)
lib/
  format.ts     generic formatters · sources.ts  generic source registry
  mp/           MP-volume data layer (types, data, loader, bio, constants, filter)
pipeline/
  engine/       registry (source-of-truth) + runner + ingest CLI + tests
  sources/mp/   one module per MP-volume source (eci, prs, mplads, …)
  build/        deterministic recompute: canonical → merge → inferences → publish (+ assert)
  lib/          generic helpers (http, csv, text, score, paths, …)
data/
  canonical/    the truth the app reads (per-subject files, index, manifest) — committed
  raw/          pipeline scraper outputs (committed; reproducible inputs)
  config/       sources + score-band config · curated/  hand-curated, sourced facts
  cache/        HTTP response cache (gitignored)
public/assets/mp/parties/   party-symbol images (served at /assets/mp/parties/…)
```

Generic, reusable code (primitives, charts, formatters) lives outside the volume folders; only
subject-specific content lives in `components/mp/` and `lib/mp/`. New volumes add a sibling folder.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Commits follow
[Conventional Commits](https://www.conventionalcommits.org/) (enforced by a commit hook).

## Licences

- **Aggregated dataset:** ODbL-1.0 · **Photos:** each under its own licence · **Code:** MIT.
- Community content (edits / discussion): separate contributor terms.

See [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) for full source credits and the re-hosting policy.
