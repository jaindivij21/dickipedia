import type { Cadence, SourceDef, StageDef } from './types.ts';
import * as eci from '../sources/mp/eci.ts';
import * as sansad from '../sources/mp/sansad.ts';
import * as myneta from '../sources/mp/myneta.ts';
import * as myneta_gap from '../sources/mp/myneta_gap.ts';
import * as wealth from '../sources/mp/wealth.ts';
import * as bonds from '../sources/mp/bonds.ts';
import * as mplads from '../sources/mp/mplads.ts';
import * as party_symbols from '../sources/mp/party_symbols.ts';
import * as photos from '../sources/mp/photos.ts';
import * as myneta_deep from '../sources/mp/myneta_deep.ts';
import * as myneta_history from '../sources/mp/myneta_history.ts';
import * as myneta_serious from '../sources/mp/myneta_serious.ts';
import * as sansad_api from '../sources/mp/sansad_api.ts';
import * as wikipedia from '../sources/mp/wikipedia.ts';
import * as party_contact from '../sources/mp/party_contact.ts';
import * as prs from '../sources/mp/prs.ts';
import * as prs_mptrack from '../sources/mp/prs_mptrack.ts';
import * as latest_news from '../sources/mp/latest_news.ts';
import * as canonical from '../build/canonical.ts';
import * as merge from '../build/merge.ts';
import * as inferences from '../build/inferences.ts';
import * as publish from '../build/publish.ts';

export const SOURCES: SourceDef[] = [
  { name: 'eci', volume: 'mp', cadence: 'semiannual', feedsScore: true, run: eci.run },
  { name: 'sansad', volume: 'mp', cadence: 'semiannual', feedsScore: true, run: sansad.run },
  { name: 'myneta', volume: 'mp', cadence: 'semiannual', feedsScore: true, run: myneta.run },
  {
    name: 'myneta_gap',
    volume: 'mp',
    cadence: 'semiannual',
    feedsScore: true,
    run: myneta_gap.run,
  },
  { name: 'wealth', volume: 'mp', cadence: 'semiannual', feedsScore: false, run: wealth.run },
  { name: 'bonds', volume: 'mp', cadence: 'semiannual', feedsScore: false, run: bonds.run },
  { name: 'mplads', volume: 'mp', cadence: 'semiannual', feedsScore: true, run: mplads.run },
  {
    name: 'party_symbols',
    volume: 'mp',
    cadence: 'semiannual',
    feedsScore: false,
    run: party_symbols.run,
  },
  { name: 'photos', volume: 'mp', cadence: 'semiannual', feedsScore: false, run: photos.run },
  {
    name: 'myneta_deep',
    volume: 'mp',
    cadence: 'semiannual',
    feedsScore: true,
    run: myneta_deep.run,
  },
  {
    name: 'myneta_history',
    volume: 'mp',
    cadence: 'semiannual',
    feedsScore: true,
    run: myneta_history.run,
  },
  {
    name: 'myneta_serious',
    volume: 'mp',
    cadence: 'semiannual',
    feedsScore: true,
    run: myneta_serious.run,
  },
  {
    name: 'sansad_api',
    volume: 'mp',
    cadence: 'semiannual',
    feedsScore: false,
    run: sansad_api.run,
  },
  { name: 'wikipedia', volume: 'mp', cadence: 'semiannual', feedsScore: false, run: wikipedia.run },
  {
    name: 'party_contact',
    volume: 'mp',
    cadence: 'semiannual',
    feedsScore: false,
    run: party_contact.run,
  },
  { name: 'prs', volume: 'mp', cadence: 'monthly', feedsScore: true, run: prs.run },
  { name: 'prs_mptrack', volume: 'mp', cadence: 'monthly', feedsScore: true, run: prs_mptrack.run },
  {
    name: 'latest_news',
    volume: 'mp',
    cadence: 'monthly',
    feedsScore: false,
    run: latest_news.run,
    stampAs: 'news',
  },
];

export const BUILD: StageDef[] = [
  { name: 'canonical', run: canonical.run },
  { name: 'merge', run: merge.run },
  { name: 'inferences', run: inferences.run },
  { name: 'publish', run: publish.run },
];

export function sourcesForCadence(cadence: Cadence): SourceDef[] {
  return cadence === 'semiannual' ? SOURCES : SOURCES.filter((s) => s.cadence === cadence);
}

export function sourceNames(): string[] {
  return SOURCES.map((s) => s.name);
}
