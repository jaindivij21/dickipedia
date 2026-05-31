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

## Roadmap — next actionables

dickipedia is early. Volume I (543 Lok Sabha MPs) is the proof of concept; the platform is built generically to grow far beyond it. High-value directions we want help with — all bound by the sourcing rule above:

- **Go full-stack.** Add a lightweight backend for live submissions, verification workflows, and richer queries, while keeping the static, JSON-first public read path as the source of truth.
- **Crowdsource with guardrails — think X's Community Notes.** Let contributors propose facts and context that surface only once corroborated against public records — never an open free-for-all (see the rule above).
- **Adopt Wikipedia's architecture, on our terms.** Crowdsourced content, regular verified updates, and a visible paper trail — every edit cited, attributable, and revertible — bound to the public-record-only rule.
- **Become a one-stop accountability hub** for each office-holder's public record.
- **Wire in civic actions.** Let people act on what they read — e.g. file an RTI request straight from a subject's page — routing only to lawful channels.
- **Deepen the inference engine.** Derive more sourced, arithmetic-only inferences from the raw data.
- **Raise data quality.** Broaden coverage, fill gaps (e.g. multi-year asset history), tighten validation, and keep sources fresh.

Want to take one on? Open an issue describing the approach before a large PR.

## Licences

Code: **MIT**. Aggregated data: **ODbL-1.0** (attribute the upstream sources). Photos: each under its own licence. Contributions are accepted under these terms.
