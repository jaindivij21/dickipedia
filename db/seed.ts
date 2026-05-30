// Seed the Wikipedia-faithful schema from data/canonical (local SQLite; same migration applies to D1).
// For each MP: subject -> one revision (snapshot blob = canonical truth) -> facts (rebuildable index) -> sources -> relationships -> score.
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import * as t from './schema.ts';

const DB_PATH = new URL('./dickipedia.db', import.meta.url).pathname;
const CANON = new URL('../data/canonical/', import.meta.url);
const MIGRATIONS = new URL('./migrations', import.meta.url).pathname;
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const sha1 = (v: unknown) => createHash('sha1').update(JSON.stringify(v)).digest('hex');
const now = 0; // deterministic timestamp for reproducible seeds

const SOURCES: Record<string, { publisher: string; url: string; sourceType: string }> = {
  eci: {
    publisher: 'Election Commission of India (via opencity.in)',
    url: 'https://data.opencity.in/dataset/parliamentary-elections-2024-results',
    sourceType: 'official_dataset',
  },
  prs: {
    publisher: 'PRS Legislative Research (via Vonter mirror)',
    url: 'https://prsindia.org/mptrack',
    sourceType: 'official_dataset',
  },
  sansad: {
    publisher: 'Lok Sabha Secretariat (sansad.in)',
    url: 'https://sansad.in/ls/members',
    sourceType: 'official_dataset',
  },
  myneta: {
    publisher: 'ADR / MyNeta.info (from ECI affidavits)',
    url: 'https://myneta.info/LokSabha2024/',
    sourceType: 'affidavit',
  },
  mplads: {
    publisher: 'MPLADS eSAKSHI (MoSPI)',
    url: 'https://mplads.mospi.gov.in/',
    sourceType: 'official_dataset',
  },
  bonds: {
    publisher: 'ECI/SBI electoral-bond disclosure (SC: ADR v Union of India)',
    url: 'https://www.eci.gov.in/',
    sourceType: 'official_dataset',
  },
  wikimedia: {
    publisher:
      'Wikimedia Commons (per-file open licence: CC0 / CC BY-SA / Public domain / GODL-India)',
    url: 'https://commons.wikimedia.org/wiki/Category:Symbols_of_political_parties_in_India',
    sourceType: 'document',
  },
};

const PROPERTIES: [string, string, string][] = [
  // key, datatype, label
  ['gender', 'string', 'Gender'],
  ['age', 'quantity', 'Age'],
  ['profession', 'string', 'Profession'],
  ['qualification', 'string', 'Qualification'],
  ['terms', 'quantity', 'Terms served'],
  ['victory_margin', 'quantity', 'Victory margin (votes)'],
  ['vote_share', 'percent', 'Vote share %'],
  ['nota_votes', 'quantity', 'NOTA votes'],
  ['num_candidates', 'quantity', 'Candidates contested'],
  ['attendance_pct', 'percent', 'Attendance %'],
  ['questions', 'quantity', 'Questions asked'],
  ['debates', 'quantity', 'Debates participated'],
  ['pmbs', 'quantity', "Private Member's Bills"],
  ['criminal_cases', 'quantity', 'Declared criminal cases'],
  ['total_assets', 'quantity', 'Declared total assets (Rs)'],
  ['total_liabilities', 'quantity', 'Declared liabilities (Rs)'],
  ['wealth_pct_increase', 'percent', 'Wealth growth 2019->2024 %'],
  ['mplads_allocated', 'quantity', 'MPLADS allocated (Rs)'],
  ['mplads_unspent', 'quantity', 'MPLADS unspent (Rs)'],
  ['mplads_utilisation_pct', 'percent', 'MPLADS utilisation %'],
  ['mplads_works_completed', 'quantity', 'MPLADS works completed'],
  ['party_bond_total', 'quantity', 'Party electoral-bond income (Rs)'],
  ['party_symbol', 'string', 'Election symbol'],
  ['represents', 'entity-ref', 'Represents (constituency)'],
  ['member_of', 'entity-ref', 'Member of (party)'],
];
const FACTMAP: [string, string, string][] = [
  // property, mp-field, source
  ['gender', 'gender', 'sansad'],
  ['age', 'age', 'sansad'],
  ['profession', 'profession', 'sansad'],
  ['qualification', 'qualification', 'sansad'],
  ['terms', 'terms', 'sansad'],
  ['victory_margin', 'margin_votes', 'eci'],
  ['vote_share', 'winner_vote_share', 'eci'],
  ['nota_votes', 'nota_votes', 'eci'],
  ['num_candidates', 'num_candidates', 'eci'],
  ['attendance_pct', 'attendance_pct', 'prs'],
  ['questions', 'questions', 'prs'],
  ['debates', 'debates', 'prs'],
  ['pmbs', 'pmbs', 'prs'],
  ['criminal_cases', 'criminal_cases', 'myneta'],
  ['total_assets', 'total_assets', 'myneta'],
  ['total_liabilities', 'total_liabilities', 'myneta'],
  ['wealth_pct_increase', 'wealth_pct_increase', 'myneta'],
  ['mplads_allocated', 'mplads_allocated', 'mplads'],
  ['mplads_unspent', 'mplads_unspent', 'mplads'],
  ['mplads_utilisation_pct', 'mplads_utilisation_pct', 'mplads'],
  ['mplads_works_completed', 'mplads_works_completed', 'mplads'],
];

async function main(): Promise<void> {
  if (existsSync(DB_PATH)) await rm(DB_PATH);
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  const db = drizzle(sqlite, { schema: t });
  migrate(db, { migrationsFolder: MIGRATIONS });

  const mps = JSON.parse(await readFile(new URL('mps.json', CANON), 'utf8')) as any[];
  const parties = JSON.parse(await readFile(new URL('parties.json', CANON), 'utf8')) as any[];
  const symbolByCode = new Map<string, string>(
    parties.filter((p) => p.symbol).map((p) => [p.code as string, p.symbol as string]),
  );
  const propDatatype = new Map(PROPERTIES.map((p) => [p[0], p[1]]));

  db.transaction((tx) => {
    // catalog: properties + sources + the import actor
    for (const [key, datatype, label] of PROPERTIES)
      tx.insert(t.properties)
        .values({ key, datatype, label, isRelation: datatype === 'entity-ref' })
        .run();
    const sourceId: Record<string, number> = {};
    for (const [k, v] of Object.entries(SOURCES))
      sourceId[k] = (
        tx
          .insert(t.sources)
          .values({ ...v, retrievedDate: '2024' })
          .returning({ id: t.sources.id })
          .get() as any
      ).id;
    const actorId = (
      tx
        .insert(t.actors)
        .values({ name: 'pipeline-import' })
        .returning({ id: t.actors.id })
        .get() as any
    ).id;
    const commentId = (
      tx
        .insert(t.comments)
        .values({ text: 'Initial pipeline import from public records' })
        .returning({ id: t.comments.id })
        .get() as any
    ).id;

    const subjectBySlug = new Map<string, number>();
    const ensureSubject = (
      type: string,
      slug: string,
      label: string,
      basis: string,
      description?: string,
    ): number => {
      const key = `${type}:${slug}`;
      if (subjectBySlug.has(key)) return subjectBySlug.get(key)!;
      const id = (
        tx
          .insert(t.subjects)
          .values({
            subjectType: type,
            slug,
            label,
            accountabilityBasis: basis,
            description,
            createdAt: now,
            touchedAt: now,
          })
          .returning({ id: t.subjects.id })
          .get() as any
      ).id;
      subjectBySlug.set(key, id);
      return id;
    };
    const addFact = (
      subjectId: number,
      propertyKey: string,
      value: any,
      srcKey: string,
      revisionId: number,
      rank = 'normal',
    ) => {
      const fid = (
        tx
          .insert(t.facts)
          .values({
            subjectId,
            propertyKey,
            value: String(value),
            valueType: propDatatype.get(propertyKey) ?? 'string',
            rank,
            factHash: sha1([subjectId, propertyKey, value]),
            originRevisionId: revisionId,
            current: true,
          })
          .returning({ id: t.facts.id })
          .get() as any
      ).id;
      tx.insert(t.factSources)
        .values({ factId: fid, sourceId: sourceId[srcKey], ordinal: 0 })
        .run();
    };

    let facts = 0,
      rels = 0;
    const partySymbolSeeded = new Set<number>();
    for (const mp of mps) {
      const mpSlug = `${slugify(mp.mp_name)}-${slugify(mp.pc_name)}`;
      const mpId = ensureSubject(
        'mp',
        mpSlug,
        mp.mp_name,
        'public_office',
        `MP for ${mp.pc_name}, ${mp.eci_state}`,
      );
      const constId = ensureSubject(
        'constituency',
        slugify(mp.pc_name),
        mp.pc_name,
        'electoral_unit',
        `Lok Sabha constituency, ${mp.eci_state}`,
      );
      const partyId = mp.party
        ? ensureSubject('party', slugify(mp.party), mp.party_full || mp.party, 'public_record')
        : null;

      // one revision carrying the full snapshot (canonical truth)
      const revId = (
        tx
          .insert(t.revisions)
          .values({
            subjectId: mpId,
            parentId: null,
            actorId,
            commentId,
            timestamp: now,
            contentSha1: sha1(mp),
            content: mp,
            sizeDelta: Object.keys(mp).length,
          })
          .returning({ id: t.revisions.id })
          .get() as any
      ).id;
      tx.update(t.subjects).set({ latestRevisionId: revId }).where(eq(t.subjects.id, mpId)).run();

      // facts (rebuildable index) — only where present; every fact carries its source
      for (const [prop, field, src] of FACTMAP) {
        const v = mp[field];
        if (v !== null && v !== undefined && v !== '') {
          addFact(mpId, prop, v, src, revId);
          facts++;
        }
      }
      // relationships (sourced graph edges)
      const repId = (
        tx
          .insert(t.relationships)
          .values({
            fromSubjectId: mpId,
            relationKey: 'represents',
            toSubjectId: constId,
            originRevisionId: revId,
            current: true,
          })
          .returning({ id: t.relationships.id })
          .get() as any
      ).id;
      tx.insert(t.relationshipSources)
        .values({ relationshipId: repId, sourceId: sourceId.eci })
        .run();
      rels++;
      if (partyId) {
        const memId = (
          tx
            .insert(t.relationships)
            .values({
              fromSubjectId: mpId,
              relationKey: 'member_of',
              toSubjectId: partyId,
              originRevisionId: revId,
              current: true,
            })
            .returning({ id: t.relationships.id })
            .get() as any
        ).id;
        tx.insert(t.relationshipSources)
          .values({ relationshipId: memId, sourceId: sourceId.eci })
          .run();
        rels++;
      }

      // party-level facts (bond total per existing behaviour; election symbol once per party)
      if (partyId && mp.party_bond_total != null)
        addFact(partyId, 'party_bond_total', mp.party_bond_total, 'bonds', revId);
      if (partyId && !partySymbolSeeded.has(partyId)) {
        partySymbolSeeded.add(partyId);
        const sym = symbolByCode.get(mp.party);
        if (sym) {
          addFact(partyId, 'party_symbol', sym, 'wikimedia', revId);
          facts++;
        }
      }

      // score
      if (mp.accountability_score != null)
        tx.insert(t.scores)
          .values({
            subjectId: mpId,
            scoreType: 'accountability_score',
            value: mp.accountability_score,
            breakdown: { source: 'v1 performance - integrity' },
            computedAt: now,
            computedFromRevisionId: revId,
          })
          .run();
    }
    console.log(`Seeded: ${subjectBySlug.size} subjects, ${facts} facts, ${rels} relationships`);
  });

  const c = (tbl: string) => (sqlite.prepare(`SELECT COUNT(*) n FROM ${tbl}`).get() as any).n;
  console.log(
    `Tables — subjects ${c('subjects')} · revisions ${c('revisions')} · facts ${c('facts')} · fact_sources ${c('fact_sources')} · relationships ${c('relationships')} · sources ${c('sources')} · properties ${c('properties')} · scores ${c('scores')}`,
  );
  sqlite.close();
  console.log(`Wrote ${DB_PATH}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
