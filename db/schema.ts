// dickipedia — Drizzle schema for Cloudflare D1 (SQLite). Wikipedia-faithful (= single-purpose Wikibase).
// See SCHEMA.md. Canonical = per-subject snapshot JSON on each revision; facts/relationships = rebuildable index.
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

/* ───────────────────── Identity & version backbone ───────────────────── */

export const subjects = sqliteTable(
  'subjects',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectType: text('subject_type').notNull(), // mp | party | constituency | ... (new vertical = data, not migration)
    slug: text('slug').notNull(),
    accountabilityBasis: text('accountability_basis').notNull(), // public_office | public_record | corporate_public_conduct | electoral_unit  (legitimacy gate)
    label: text('label').notNull(),
    description: text('description'),
    aliases: text('aliases', { mode: 'json' }).$type<string[]>().default([]),
    latestRevisionId: integer('latest_revision_id'), // denormalized HEAD pointer (never scan history on read)
    isRedirect: integer('is_redirect', { mode: 'boolean' }).default(false),
    redirectToId: integer('redirect_to_id'),
    protectionLevel: text('protection_level'), // null | pending-changes | autoconfirmed | extendedconfirmed | sysop
    touchedAt: integer('touched_at'), // cache-invalidation ts
    createdAt: integer('created_at'),
  },
  (t) => ({
    typeSlug: uniqueIndex('subjects_type_slug').on(t.subjectType, t.slug),
    typeIdx: index('subjects_type').on(t.subjectType),
  }),
);

export const actors = sqliteTable(
  'actors',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id'), // NULL for IP / import
    name: text('name').notNull(), // username OR IP string
  },
  (t) => ({ nameIdx: index('actors_name').on(t.name) }),
);

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hash: text('hash'),
  text: text('text'),
  data: text('data', { mode: 'json' }),
});

export const revisions = sqliteTable(
  'revisions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id').notNull(),
    parentId: integer('parent_id'), // → prior revision; NULL = first (the history chain)
    actorId: integer('actor_id').notNull(),
    commentId: integer('comment_id'),
    timestamp: integer('timestamp').notNull(),
    contentSha1: text('content_sha1'), // hash of the snapshot → dedup + tamper-evidence
    content: text('content', { mode: 'json' }), // CANONICAL per-subject snapshot blob (Wikipedia-style)
    isMinor: integer('is_minor', { mode: 'boolean' }).default(false),
    sizeDelta: integer('size_delta'),
    deleted: integer('deleted').default(0), // RevisionDelete bitfield (text=1/comment=2/user=4/restricted=8)
    revertOfRevisionId: integer('revert_of_revision_id'),
  },
  (t) => ({
    subjIdx: index('revisions_subject').on(t.subjectId, t.id),
    parentIdx: index('revisions_parent').on(t.parentId),
  }),
);

/* ───────────────────── Structured data (Wikibase layer) ───────────────────── */

export const properties = sqliteTable('properties', {
  key: text('key').primaryKey(), // readable slug, e.g. declared_total_assets
  datatype: text('datatype').notNull(), // entity-ref | quantity | time | string | url | external-id | monolingual
  label: text('label').notNull(),
  description: text('description'),
  isRelation: integer('is_relation', { mode: 'boolean' }).default(false),
});

export const sources = sqliteTable(
  'sources',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    publisher: text('publisher'),
    url: text('url'),
    title: text('title'),
    author: text('author'),
    publishedDate: text('published_date'),
    retrievedDate: text('retrieved_date'),
    archiveUrl: text('archive_url'),
    sourceType: text('source_type'), // official_dataset | affidavit | news | document
  },
  (t) => ({ urlIdx: index('sources_url').on(t.url) }),
);

export const facts = sqliteTable(
  'facts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id').notNull(),
    propertyKey: text('property_key').notNull(),
    value: text('value'), // typed value, serialized
    valueType: text('value_type'),
    snaktype: text('snaktype').notNull().default('value'), // value | somevalue (declared-undisclosed) | novalue (declared-none)
    rank: text('rank').notNull().default('normal'), // preferred | normal | deprecated (retained-but-known-wrong)
    factHash: text('fact_hash'),
    originRevisionId: integer('origin_revision_id'), // copy-on-write: revision that first introduced this exact fact
    current: integer('current', { mode: 'boolean' }).default(true),
    period: text('period'), // e.g. 18th-LS, FY2024
  },
  (t) => ({
    subjPropIdx: index('facts_subject_property').on(t.subjectId, t.propertyKey),
    propIdx: index('facts_property').on(t.propertyKey),
  }),
);

export const factQualifiers = sqliteTable(
  'fact_qualifiers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    factId: integer('fact_id').notNull(),
    qualifierPropertyKey: text('qualifier_property_key').notNull(), // start_time | point_in_time | provenance (e.g. "as self-declared")
    value: text('value'),
    valueType: text('value_type'),
    ordinal: integer('ordinal').default(0),
  },
  (t) => ({ factIdx: index('fact_qualifiers_fact').on(t.factId) }),
);

// every fact requires >=1 row here (the "no source, no row" invariant, enforced at the write gate)
export const factSources = sqliteTable(
  'fact_sources',
  {
    factId: integer('fact_id').notNull(),
    sourceId: integer('source_id').notNull(),
    ordinal: integer('ordinal').default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.factId, t.sourceId] }) }),
);

export const relationships = sqliteTable(
  'relationships',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fromSubjectId: integer('from_subject_id').notNull(),
    relationKey: text('relation_key').notNull(), // represents | member_of | donated_to | relative_of | runner_up_in
    toSubjectId: integer('to_subject_id').notNull(),
    rank: text('rank').notNull().default('normal'),
    originRevisionId: integer('origin_revision_id'),
    current: integer('current', { mode: 'boolean' }).default(true),
    period: text('period'),
  },
  (t) => ({
    fromIdx: index('relationships_from').on(t.fromSubjectId, t.relationKey),
    toIdx: index('relationships_to').on(t.toSubjectId, t.relationKey),
  }),
);

export const relationshipSources = sqliteTable(
  'relationship_sources',
  {
    relationshipId: integer('relationship_id').notNull(),
    sourceId: integer('source_id').notNull(),
    ordinal: integer('ordinal').default(0),
  },
  (t) => ({ pk: primaryKey({ columns: [t.relationshipId, t.sourceId] }) }),
);

/* ───────────────────── Governance ───────────────────── */

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email'),
    passwordHash: text('password_hash'),
    oauth: text('oauth', { mode: 'json' }),
    createdAt: integer('created_at'),
    editCount: integer('edit_count').default(0), // autoconfirmed/extended-confirmed are COMPUTED from this + age
  },
  (t) => ({ nameIdx: uniqueIndex('users_name').on(t.name) }),
);

export const userGroups = sqliteTable(
  'user_groups',
  {
    userId: integer('user_id').notNull(),
    group: text('group').notNull(), // patroller | admin | bot
    expiry: integer('expiry'),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.group] }) }),
);

export const subjectRestrictions = sqliteTable(
  'subject_restrictions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id').notNull(),
    type: text('type').notNull(), // edit | move
    level: text('level').notNull(), // pending-changes | autoconfirmed | extendedconfirmed | sysop
    expiry: integer('expiry'),
  },
  (t) => ({ subjIdx: index('subject_restrictions_subject').on(t.subjectId) }),
);

export const blocks = sqliteTable('blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  targetActorId: integer('target_actor_id').notNull(),
  byActorId: integer('by_actor_id').notNull(),
  reasonId: integer('reason_id'),
  timestamp: integer('timestamp'),
  expiry: integer('expiry'), // NULL = indefinite
  isSitewide: integer('is_sitewide', { mode: 'boolean' }).default(true),
  scopeSubjectId: integer('scope_subject_id'), // non-null = partial (per-subject) block
});

export const logging = sqliteTable(
  'logging',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type').notNull(), // delete | protect | block | rights | move
    action: text('action').notNull(),
    timestamp: integer('timestamp').notNull(),
    actorId: integer('actor_id').notNull(),
    subjectId: integer('subject_id'),
    commentId: integer('comment_id'),
    params: text('params', { mode: 'json' }),
    deleted: integer('deleted').default(0),
  },
  (t) => ({ tsIdx: index('logging_ts').on(t.timestamp) }),
);

/* ───────────────────── Derived projections (rebuildable) ───────────────────── */

export const scores = sqliteTable(
  'scores',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id').notNull(),
    scoreType: text('score_type').notNull(), // accountability_score | ...
    value: integer('value'),
    breakdown: text('breakdown', { mode: 'json' }),
    computedAt: integer('computed_at'),
    computedFromRevisionId: integer('computed_from_revision_id'),
  },
  (t) => ({ subjIdx: index('scores_subject').on(t.subjectId, t.scoreType) }),
);

export const recentChanges = sqliteTable(
  'recent_changes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: integer('timestamp').notNull(),
    actorId: integer('actor_id').notNull(),
    subjectId: integer('subject_id'),
    subjectType: text('subject_type'),
    changeType: text('change_type'), // fact_add | fact_edit | relationship_add | score_recompute | revert | log
    sourceId: integer('source_id'),
    oldValue: text('old_value'),
    newValue: text('new_value'),
    patrolled: integer('patrolled').default(0), // 0 needs-review | 1 reviewed | 2 autopatrolled
    reviewPriority: integer('review_priority').default(0),
    isBot: integer('is_bot', { mode: 'boolean' }).default(false),
    thisRevisionId: integer('this_revision_id'),
    lastRevisionId: integer('last_revision_id'),
    deleted: integer('deleted').default(0),
  },
  (t) => ({
    tsIdx: index('rc_ts').on(t.timestamp),
    patrolIdx: index('rc_patrolled').on(t.patrolled, t.reviewPriority),
  }),
);

export const pageDependencies = sqliteTable(
  'page_dependencies',
  {
    subjectId: integer('subject_id').notNull(),
    dependentPath: text('dependent_path').notNull(), // a route to revalidate when this subject changes
    dependencyType: text('dependency_type'), // leaderboard | relationship_counterpart | aggregate
  },
  (t) => ({ pk: primaryKey({ columns: [t.subjectId, t.dependentPath] }) }),
);

/* ───────────────────── Social (v2+) ───────────────────── */

export const talkThreads = sqliteTable(
  'talk_threads',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    subjectId: integer('subject_id').notNull(),
    factId: integer('fact_id'), // nullable → dispute a specific fact
    actorId: integer('actor_id').notNull(),
    parentThreadId: integer('parent_thread_id'),
    body: text('body'),
    timestamp: integer('timestamp'),
  },
  (t) => ({ subjIdx: index('talk_subject').on(t.subjectId) }),
);

export const watchlist = sqliteTable(
  'watchlist',
  {
    userId: integer('user_id').notNull(),
    subjectId: integer('subject_id').notNull(),
    notificationTimestamp: integer('notification_timestamp'),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.subjectId] }) }),
);
