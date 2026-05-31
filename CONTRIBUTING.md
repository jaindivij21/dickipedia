# Contributing to dickipedia

dickipedia is an open, public-interest accountability encyclopedia of public power — Wikipedia-like, but different. **Volume I covers India's 543 Lok Sabha MPs (18th Lok Sabha, 2024)**; the platform is built generically for future volumes of public office-holders. The whole project rests on one rule:

> **Every claim is a public record about a public official's public conduct — sourced, neutral, no accusations.**

Please keep every contribution inside that line.

## Ways to contribute

- **Spot a wrong number?** Open a **Data correction** issue and include the **public-record source** (ECI, PRS, Sansad, the ECI affidavit, CAG, a court order, a gazette). _No source, no change._ This is the v1 crowd-correction channel; Wikipedia-style in-app editing comes in v2.
- **Know a public data source we're missing?** Open a **New feature or data source** issue with the link **and its licence**.
- **Code:** fork → branch → PR (Conventional Commits). The TypeScript pipeline lives in `pipeline/`; `npm run ingest -- --cadence monthly|semiannual` refreshes sources and `npm run rebuild` regenerates `data/canonical/`. Generic code stays in `components/ui`, `components/charts`, `lib/`; subject-specific code in `components/mp`, `lib/mp`.

## Sourcing & legal rules (non-negotiable)

- Public **officials** only — never private individuals.
- Facts + arithmetic from public records; **the project authors no accusation**.
- Criminal data is shown **"as self-declared (pending ≠ convicted)"**.
- Electoral-bond funding is **party-level**, never pinned to an individual office-holder.
- No re-hosting of non-open sources (e.g. MyNeta parsed dumps, Sansad portraits) — see `ATTRIBUTIONS.md`.

## Licences

Code: **MIT**. Aggregated data: **ODbL-1.0** (attribute the upstream sources). Photos: each under its own licence. Contributions are accepted under these terms.
