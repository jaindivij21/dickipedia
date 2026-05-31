# Description

<!-- What does this PR change and why? Keep it focused: one purpose per PR. -->

## Type of change

- [ ] Bug fix
- [ ] Feature (UI / site)
- [ ] Data correction
- [ ] Data pipeline / ingestion source
- [ ] Refactor (no behaviour change)
- [ ] Docs / governance

## Related issues

Closes #

## Legitimacy checklist (required for any data, pipeline, or content change)

- [ ] Every fact traces to a public registry (e.g. `eci` / `prs` / `sansad` / `myneta` / `mplads` / `bonds`)
- [ ] No platform-authored accusation — facts are reported and cited, not characterised
- [ ] Self-declared data is reproduced **as self-declared** (e.g. criminal cases: "pending ≠ convicted")
- [ ] Funding/edge figures are kept at the correct level (e.g. electoral bonds stay party-level, never per office-holder)
- [ ] No re-hosting of non-open sources (portraits hotlinked; licences honoured per `ATTRIBUTIONS.md`)

**Sourcing summary** <!-- which registries, which URLs, any conflicts found -->

## Code quality checklist

- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` all pass
- [ ] Generic code stays out of volume folders (`components/ui`, `components/charts`, `lib/format`, `lib/sources`); subject-specific code stays in its volume folder (`components/mp`, `lib/mp`)
- [ ] No new comments (only `// @note` / `// @todo`); no `any`; constants extracted; components under ~150 lines
- [ ] Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:` …)

## Pipeline (if data / ingestion changed)

- [ ] `npm run rebuild` re-run; the `data/canonical` diff is intended (subject count unchanged; scores in [0,100])
- [ ] `npm run assert:canonical` passes
- [ ] A new source is registered in `pipeline/registry.ts` (script, cadence, feeds-score)

## Notes / screenshots

<!-- Anything reviewers should know; before/after screenshots for UI. -->
