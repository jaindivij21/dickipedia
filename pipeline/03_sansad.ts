import { mkdir, writeFile } from 'node:fs/promises';
import { fetchJson } from './lib/http.ts';
import { normConstituency, normName, normParty } from './lib/text.ts';

const API = 'https://sansad.in/api_ls/member?perPageSize=6000';
const OUT = new URL('../data/raw/', import.meta.url);
const str = (v: unknown): string => (v == null ? '' : String(v)).trim();

interface RawMember {
  mpsno: number;
  mpFirstLastName?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  partyFname?: string;
  partySname?: string;
  stateName?: string;
  constName?: string;
  profession?: string;
  lastLoksabha?: number;
  status?: string;
  age?: number | string;
  email?: string;
  phone?: string;
  noOfTerms?: number;
  imageUrl?: string;
  profileUrl?: string;
  dob?: string;
  qualification?: string;
}

async function main(): Promise<void> {
  console.log('Fetching Sansad member directory (Lok Sabha Secretariat; facts + deeplink only)...');
  const data = await fetchJson<{ membersDtoList: RawMember[] }>(API);
  const all = data.membersDtoList || [];
  const sitting = all.filter((m) => m.lastLoksabha === 18 && /sitting/i.test(m.status || ''));
  const out = sitting.map((m) => {
    const name = str(m.mpFirstLastName) || `${str(m.firstName)} ${str(m.lastName)}`.trim();
    return {
      mpsno: m.mpsno,
      name,
      name_norm: normName(name),
      constituency: str(m.constName),
      constituency_norm: normConstituency(str(m.constName)),
      state: str(m.stateName),
      party: normParty(str(m.partyFname) || str(m.partySname)).short,
      gender: str(m.gender),
      age: m.age != null ? Number(String(m.age).replace(/[^0-9]/g, '')) || null : null,
      dob: str(m.dob),
      profession: str(m.profession),
      qualification: str(m.qualification),
      terms: m.noOfTerms ?? null,
      email: str(m.email),
      phone: str(m.phone),
      photo_hotlink: str(m.imageUrl), // hotlink only — do NOT re-host
      profile_url: str(m.profileUrl),
      _provenance: {
        source: 'Lok Sabha Secretariat (sansad.in)',
        license: 'Facts + deeplink only',
        url: 'https://sansad.in/ls/members',
      },
    };
  });

  await mkdir(OUT, { recursive: true });
  await writeFile(new URL('sansad_18th.json', OUT), JSON.stringify(out, null, 2));
  console.log(
    `Sansad total members: ${all.length}; sitting 18th-LS: ${out.length} (expected ~543)`,
  );
  console.log(
    `With photo link: ${out.filter((m) => m.photo_hotlink).length}; with email: ${out.filter((m) => m.email).length}`,
  );
  console.log(`Wrote ${new URL('sansad_18th.json', OUT).pathname}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
