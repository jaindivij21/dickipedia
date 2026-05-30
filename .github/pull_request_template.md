# Description

<!-- What does this PR change and why? Keep it focused: one purpose per PR. -->

## Type of change

- [ ] Bug fix
- [ ] Feature (UI / site)
- [ ] Data correction
- [ ] Data pipeline / scraper
- [ ] Database schema change
- [ ] Refactor (no behaviour change)
- [ ] Docs / governance

## Related issues

Closes #

## Legitimacy checklist (required for any data, pipeline, or content change)

- [ ] Every fact traces to a public registry (`eci` / `prs` / `sansad` / `myneta` / `mplads` / `bonds`)
- [ ] No platform-authored accusation — facts are reported and cited, not characterised
- [ ] Criminal data is reproduced **as self-declared** ("pending ≠ convicted")
- [ ] Electoral-bond figures are kept **party-level**, not pinned to an individual MP
- [ ] No re-hosting of non-open sources (portraits hotlinked; licences honoured per `ATTRIBUTIONS.md`)

**Sourcing summary** <!-- which registries, which URLs, any conflicts found -->

## Code quality checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` and `npm run format:check` pass
- [ ] `npm run build` succeeds
- [ ] No new comments; no `any`; constants extracted to `lib/`; components under ~150 lines

## Pipeline / DB (if applicable)

- [ ] `npm run canonical` re-run; `data/canonical` diff is intended (543 rows; scores in [0,100])
- [ ] `npm run seed` succeeds
- [ ] Schema changed → `npm run db:generate` run and migration committed

## Notes / screenshots

<!-- Anything reviewers should know; before/after screenshots for UI. -->
