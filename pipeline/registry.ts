export type Cadence = 'monthly' | 'semiannual';

export interface Source {
  name: string;
  script: string;
  cadence: Cadence;
  feedsScore: boolean;
  note?: string;
}

export const SOURCES: Source[] = [
  { name: 'eci', script: '01_eci_spine.ts', cadence: 'semiannual', feedsScore: true },
  { name: 'sansad', script: '03_sansad.ts', cadence: 'semiannual', feedsScore: true },
  { name: 'myneta', script: '04_myneta.ts', cadence: 'semiannual', feedsScore: true },
  { name: 'myneta_gap', script: '08_myneta_gap.ts', cadence: 'semiannual', feedsScore: true },
  { name: 'wealth', script: '05_myneta_wealth.ts', cadence: 'semiannual', feedsScore: false },
  { name: 'bonds', script: '06_bonds.ts', cadence: 'semiannual', feedsScore: false },
  { name: 'mplads', script: '07_mplads.ts', cadence: 'semiannual', feedsScore: true },
  {
    name: 'party_symbols',
    script: '09_party_symbols.ts',
    cadence: 'semiannual',
    feedsScore: false,
  },
  { name: 'photos', script: '09_photos.ts', cadence: 'semiannual', feedsScore: false },
  { name: 'myneta_deep', script: '11_myneta_deep.ts', cadence: 'semiannual', feedsScore: true },
  {
    name: 'myneta_history',
    script: '12_myneta_history.ts',
    cadence: 'semiannual',
    feedsScore: true,
  },
  {
    name: 'myneta_serious',
    script: '20_myneta_serious.ts',
    cadence: 'semiannual',
    feedsScore: true,
  },
  { name: 'sansad_api', script: '14_sansad_api.ts', cadence: 'semiannual', feedsScore: false },
  { name: 'wikipedia', script: '15_wikipedia.ts', cadence: 'semiannual', feedsScore: false },
  {
    name: 'party_contact',
    script: '16_party_contact.ts',
    cadence: 'semiannual',
    feedsScore: false,
  },
  { name: 'prs', script: '02_prs_vonter.ts', cadence: 'monthly', feedsScore: true },
  { name: 'prs_mptrack', script: '13_prs_mptrack.ts', cadence: 'monthly', feedsScore: true },
  { name: 'latest_news', script: '19_latest_news.ts', cadence: 'monthly', feedsScore: false },
];

export function sourcesForCadence(cadence: Cadence): Source[] {
  return cadence === 'semiannual' ? SOURCES : SOURCES.filter((s) => s.cadence === cadence);
}

export function sourceNames(): string[] {
  return SOURCES.map((s) => s.name);
}
