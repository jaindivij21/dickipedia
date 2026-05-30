# dickipedia — schema (Wikipedia-faithful)

## Framing: dickipedia = a single-purpose Wikibase

Structurally this is **Wikidata's engine (Wikibase) on MediaWiki's revision substrate**, specialised for sourced accountability data:

| dickipedia                               | Wikibase / MediaWiki                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| **Subject** (a typed accountable entity) | Wikibase **Item** (a versioned page)                                      |
| **Fact** (subject × property × value)    | Wikibase **Statement** (mainSnak + rank)                                  |
| **Source**                               | Statement **reference**                                                   |
| **Relationship** (edge between subjects) | entity-valued **Statement** (edges & attributes are one primitive)        |
| **Revision**                             | MediaWiki **revision** (immutable, `parent_id` chain, `page_latest` HEAD) |

**The key trick to copy:** Wikibase didn't build a parallel versioning system — it reused `page → revision` and dropped a **structured JSON blob** where wikitext used to be, inheriting history/diff/rollback/protection/recentchanges/watchlist for free. dickipedia does the same, tiny, on D1.

## Architectural law: source-of-truth vs rebuildable

- **Source of truth (kept forever):** `revisions` (+ the canonical per-subject JSON blob they carry) and `logging`. Relationship _edges_ too (authored + sourced).
- **Rebuildable projections (regenerable from revisions):** the `facts`/`relationships` relational index, `scores`, search index, `recent_changes`, `page_dependencies`, and the rendered pages. (Mirrors MediaWiki's `pagelinks`/`categorylinks`/`recentchanges`.)

## Core tables (~10 lean tables on D1/Neon via Drizzle)

### Identity & version backbone

- **subjects** — stable identity + HEAD pointer. `id` PK · `subject_type` (mp/party/constituency/… = _new vertical = data, not migration_) · `slug` (unique with type) · **`accountability_basis` NOT NULL** (the public-record-only legitimacy gate) · `label` · `description` · `aliases` (JSON) · `latest_revision_id` (FK → the denormalized HEAD; never scan history on the hot path) · `is_redirect`/`redirect_to_id` · `protection_level` · `touched_at`. _(= MediaWiki `page` + Wikibase Item fingerprint.)_
- **revisions** — immutable append-only history. `id` PK · `subject_id` · `parent_id` (→ prior revision; NULL = first) · `actor_id` · `comment_id` · `timestamp` · `content_sha1` (hash over the revision's facts → dedup + tamper-evidence) · `is_minor` · `size_delta` · `deleted` (bitfield for in-place RevisionDelete) · `revert_of_revision_id`. _(= `revision` table, copied 1:1.)_
- **actors** — normalized identity for ALL attribution (registered user OR anon IP). `id` · `user_id` (NULL for IP/import) · `name`. _(= `actor`.)_
- **comments** — immutable edit summaries / log reasons. `id` · `hash` · `text` · `data` (JSON). _(= `comment`.)_

### Structured data (the Wikibase layer)

- **properties** — typed metric/predicate registry. `key` PK (readable slug, e.g. `declared_total_assets`) · `datatype` (entity-ref | quantity | time | string | url | external-id | monolingual) · `label` · `is_relation`. **New metric/vertical = INSERT a row, no migration.** _(= Wikibase Property + datatype.)_
- **facts** — the structured payload (= Statement). `id` · `subject_id` · `property_key` · `value` (typed, inline) · `snaktype` (value | somevalue _declared-undisclosed_ | novalue _declared-none_) · `rank` (preferred | normal | deprecated — supersession without deletion; `deprecated` = retained-but-known-wrong) · `fact_hash` (content-addressed dedup) · `origin_revision_id` (copy-on-write: revision that first introduced this exact fact) · `current` (bool).
- **fact_qualifiers** — period/context without new columns. `fact_id` · `qualifier_property_key` (start_time/point_in_time/**provenance**) · `value` · `ordinal`. _(Carries the period dimension AND the mandatory "as self-declared" qualifier on criminal data.)_
- **sources** — structured provenance, referenced by many facts. `id` · `publisher` · `url` · `title` · `author` · `published_date` · `retrieved_date` · `archive_url` · `source_type` (official_dataset | affidavit | news | …).
- **fact_sources** — M:N join (fact ↔ sources). The **every-fact-needs-a-source invariant** = ≥1 row required per fact at the write gate.
- **relationships** — first-class **sourced** graph edges. `id` · `from_subject_id` · `relation_key` (entity-ref property) · `to_subject_id` · `rank` · `origin_revision_id` · `current` · (sources via join, period via qualifiers). _(= entity-valued Statement; sourced, unlike throwaway `pagelinks`.)_

### Governance

- **users** — accounts. `id` · `name` · `email` · `password_hash/oauth` · `created_at` · `edit_count`. (autoconfirmed/extended-confirmed are **computed** from edit_count+age, like Wikipedia.)
- **user_groups** — capability tiers. `user_id` · `group` (patroller | admin | …) · `expiry`. _(= `user_groups`.)_
- **subject_restrictions** — per-subject protection. `subject_id` · `type` (edit|move) · `level` (autoconfirmed | extendedconfirmed | sysop | **pending-changes**) · `expiry`. _(= `page_restrictions`.)_
- **blocks** — preventive edit-prevention (actor-level + partial per-subject). _(= `block`/`block_target`, thinned.)_
- **logging** — immutable admin audit trail; **the act of hiding is itself logged.** `id` · `type` (delete|protect|block|rights) · `action` · `actor_id` · `subject_id` · `comment_id` · `params` (JSON) · `deleted`. _(= `logging`.)_

### Derived projections (rebuildable)

- **scores** — computed accountability metrics. `subject_id` · `score_type` · `value` · `breakdown_json` · `computed_from_revision_id`. (Recomputed in a Queue; never source of truth.)
- **recent_changes** — derived feed = transparency stream **+** moderation queue. `id` · `timestamp` · `actor_id` · `subject_id` · `change_type` · `old_value`/`new_value` · **`patrolled` (0 needs-review / 1 reviewed / 2 autopatrolled)** · `review_priority` · `this_revision_id`. Pruned by Cron. _(= `recentchanges` + `rc_patrolled`.)_
- **page_dependencies** — hand-rolled recursive-purge map. `subject_id` · `dependent_path` · `dependency_type` (leaderboard | relationship_counterpart). _(= `templatelinks` recursive CDN purge, free-tier.)_

### Social (v2+)

- **talk_threads** — per-subject AND per-fact discussion (dispute a specific fact). _(= Talk namespace, flattened.)_
- **watchlist** — per-user subject monitoring (deferred to v2).

## Legitimacy invariants (enforced as code at the write gate, not policy prose)

1. **Public-record subjects only** — `subjects.accountability_basis` NOT NULL.
2. **No source, no row** — every `fact` and `relationship` requires ≥1 `fact_sources` row.
3. **Platform authors no accusations** — no free-text accusatory fields exist; only neutral typed metrics.
4. **Criminal data "as self-declared"** — mandatory `provenance` qualifier + required reference; disputed/false claims get `rank=deprecated` (retained, never deleted), presumption-of-innocence framing.

> This is **WP:BLP + WP:V turned into enforced schema constraints** — the system physically cannot store an unsourced or accusatory claim.
