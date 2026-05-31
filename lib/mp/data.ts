import indexJson from '@/data/canonical/index.json';
import partiesJson from '@/data/canonical/parties.json';
import manifestJson from '@/data/canonical/manifest.json';
import type { SlimMp, Party, CanonicalIndex, Manifest } from '@/lib/mp/types';

export * from '@/lib/mp/types';

const INDEX = indexJson as unknown as CanonicalIndex;
export const SLIM_MPS: SlimMp[] = INDEX.mps;
export const AGGREGATES = INDEX.aggregates;
export const MANIFEST = manifestJson as unknown as Manifest;

const SLUG_SET = new Set(SLIM_MPS.map((m) => m.slug));
export const allSlugs = (): string[] => [...SLUG_SET];
export const hasSlug = (slug: string): boolean => SLUG_SET.has(slug);

export const AVG_ATT = AGGREGATES.avg_attendance;
export const AVG_Q = AGGREGATES.avg_questions;
export const AVG_DEBATES = AGGREGATES.avg_debates;
export const AVG_UTIL = AGGREGATES.avg_util;

export const featuredMp = (): SlimMp | undefined =>
  SLIM_MPS.find((m) => m.slug === AGGREGATES.featured_slug);

export const ALL_PARTIES: Party[] = partiesJson as Party[];
const PARTY_BY_CODE = new Map(ALL_PARTIES.map((p) => [p.code, p]));
export const getParty = (code: string): Party | undefined => PARTY_BY_CODE.get(code);

export const states = (): string[] => INDEX.facets.states;
export const parties = (): string[] => INDEX.facets.parties;
