# Proposal (DRAFT — for owner sign-off): a press-engagement source for ministers/PM

> Status: **proposal only, no code written.** This path requires amending dickipedia's
> non-negotiable legitimacy invariants (§2 and §3 of `CLAUDE.md`). That is a governance
> decision for the project owner. Nothing here ships until those amendments are explicitly
> accepted in `CLAUDE.md`.

## 1. Why this proposal exists

The accountability question "does this leader face the press / take open questions?" (the
canonical example: the PM has held effectively no open-question press conferences) is real,
public-interest, and about public conduct of public officials. But:

- It maps to **none of the six registries** (`eci/prs/sansad/myneta/mplads/bonds`) — invariant §2.
- For ministers/PM, PRS suppresses parliamentary metrics by design, so the **faithful Phase-1
  engagement signal correctly does not fire** for them (and _should not_ — flagging a minister as
  "silent in parliament" would be false; ministers answer rather than ask).

So surfacing press engagement at all requires (a) a **new, seventh data source**, and (b) a
conscious **relaxation of invariants §2 and §3**. This document scopes exactly what that costs.

## 2. What would have to change in CLAUDE.md (the hard part)

**Invariant §2 (six registries).** Add a seventh, explicitly second-tier source class, e.g.:

> `pib` — Press Information Bureau press-conference / media-briefing listings, **government
> spokespersons only** (PM, Union Ministers, ministries). Marked `sourceType: 'press_listing'`,
> a tier BELOW `official_dataset`/`affidavit`. Coverage is **not** per-MP; absence is **never**
> a signal for non-listed members.

**Invariant §3 (no platform-authored characterisation).** This must **not** be loosened to permit
"afraid of press" / "evasive". Instead, ratify the existing house style explicitly:

> Press engagement is reported **only as sourced counts and dates** ("Held N press conferences
> taking questions, per PIB, between X and Y"; "No open-question press conference on record since
> Z, per PIB listings"). The platform never labels the person. The number indicts; the platform
> does not.

The `BANNED` guard (`pipeline/lib/text.ts`) stays in force and must pass on every press headline.

## 3. Data source — reality check

- **PIB (pib.gov.in)** logs press conferences / media invitations, but **only at PM / minister /
  ministry granularity**, as HTML/ASPX (not machine-readable), and a direct fetch returns 403 in
  some paths. It indexes **government spokespersons**, not the 543 backbench/opposition MPs.
- The "PM = zero open press conferences" fact is **hand-compiled journalism** (Scroll, Newslaundry,
  The Diplomat), not a dataset.

**Consequence:** coverage is structurally limited to ~PM + Union Ministers (~58 MPs at most), is
fragile (HTML scraping + manual journalism cross-checks), needs ongoing upkeep, and can never be a
clean per-MP metric. This is a **labelled, partial, second-tier** feature — not a registry-grade one.

## 4. Build sketch (only if §2/§3 amended)

1. **New scraper** `pipeline/2x_pib_press.ts` — scrape PIB press-conference/media-invitation
   listings for the PM + Union Ministers; parse date + title + url; throttled + disk-cached, per
   `pipeline/lib/http.ts`. Output `data/raw/pib_press.json` with `_provenance`.
2. **Crosswalk** minister name → `pc_id` (only ministers/PM; non-ministers get nothing, not zero).
3. **Merge** in `pipeline/17_merge.ts`: add `press_engagement: { count, last_date, source_url } | null`
   — `null` for everyone not covered (the honesty default; absence ≠ "took no questions").
4. **Source registry**: add `pib` to `lib/sources.ts` (`SRC`) and `db/seed.ts` (`SOURCES` +
   `PROPERTIES` + `FACTMAP`), `sourceType: 'press_listing'`.
5. **UI**: a section/inference that states the **count + dates only**, with a prominent caveat:
   "PIB lists government spokespersons only; this is not tracked for non-ministers." Never an
   "afraid"/"evasive" label. Keep it **out of the accountability score**.
6. **Inference** (optional, neutral): "No open-question press conference appears in PIB listings for
   this minister between {first} and {last}." Sourced `['pib']`; must pass the `BANNED` guard.

## 5. Risks (flagged, not hidden)

1. **Legitimacy dilution.** A second-tier, partial, scraped source sits uneasily beside the
   registry-grade six. The project's whole credibility is "every fact, a public registry."
2. **Selective-coverage bias.** Only ministers are coverable → the feature visually singles out
   the governing party's office-holders. Must be framed as a _government-spokesperson_ metric, or
   it reads as partisan.
3. **Defamation surface.** Even neutral counts about a named PM/minister invite challenge; the
   "absence = silence" inference is the riskiest and may be better dropped.
4. **Maintenance.** PIB HTML + journalism cross-checks rot; stale data is worse than none.

## 6. Recommendation

- **Default recommendation: do NOT adopt.** The faithful Phase-1 parliamentary-engagement signal
  already captures "puts themselves on the public record" for the ~485 non-ministers, sourced and
  registry-grade. Press engagement cannot be done at registry grade and forces a foundational
  trade-off for ~58 coverable subjects.
- **If adopted anyway:** ship it strictly as a **labelled `pib` second-tier source**, **counts +
  dates only**, **never a characterisation**, **out of the score**, and **`null` (not zero) for
  everyone uncovered** — with the §2/§3 amendments written into `CLAUDE.md` first.
