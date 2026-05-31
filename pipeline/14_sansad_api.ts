import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fetchJsonOrNull, sleep } from './lib/http.ts';
import { deobfuscateContact } from './lib/text.ts';
import type { Provenance } from './lib/types.ts';

const CANON = new URL('../data/canonical/', import.meta.url);
const RAW = new URL('../data/raw/', import.meta.url);
const MEMBER = (mpsno: number): string => `https://sansad.in/api_ls/member/${mpsno}`;
const SLEEP_MS = 250;
const FLUSH_EVERY = 60;
const PROVENANCE: Provenance = {
  source: 'Lok Sabha Secretariat (sansad.in api_ls)',
  license: 'Facts + deeplink only',
  url: 'https://sansad.in/ls/members',
};

interface CrosswalkRow {
  pc_id: string;
  sansad: { mpsno: number | null };
}
interface Social {
  platform: string;
  url: string;
}
interface Contact {
  emails: string[];
  phones: string[];
  address: string | null;
  socials: Social[];
}
interface SansadDeepRow {
  pc_id: string;
  mpsno: number;
  contact: Contact | null;
  committees: { name: string; role: string | null }[] | null;
  reachable: { contact: boolean; committees: boolean };
  _provenance: Provenance;
}

interface MemberDto {
  email?: string[] | string | null;
  phone?: string | null;
  personalPhone?: string | null;
  delhiPhone?: string | null;
  permanentFaddr?: string | null;
  permanentLaddr?: string | null;
  presentFaddr?: string | null;
  presentLaddr?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  linkedIn?: string | null;
  pinterest?: string | null;
}

const SOCIAL_BASE: Record<string, string> = {
  facebook: 'https://facebook.com/',
  twitter: 'https://twitter.com/',
  instagram: 'https://instagram.com/',
  linkedin: 'https://www.linkedin.com/in/',
  pinterest: 'https://pinterest.com/',
};
const cleanText = (s?: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim();
const isJunk = (s: string): boolean => !s || /^(na|n\/a|nil|none|0|-|\.)$/i.test(s);
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

function extractEmails(raw: string[] | string | null | undefined): string[] {
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const found = items.flatMap((e) => deobfuscateContact(e).match(EMAIL_RE) ?? []);
  return [...new Set(found.map((e) => e.toLowerCase()))];
}

function extractPhones(...fields: (string | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const f of fields)
    for (const part of cleanText(f).split(/[,;/]+|<br\s*\/?>/i)) {
      const digits = part.replace(/[^\d]/g, '');
      if (digits.length >= 10 && digits.length <= 12) out.add(digits.slice(-10));
    }
  return [...out];
}

function social(platform: string, raw?: string | null): Social | null {
  const v = cleanText(raw);
  if (isJunk(v)) return null;
  if (/^https?:\/\//i.test(v)) return { platform, url: v };
  const handle = v.replace(/^@/, '').replace(/\s+/g, '');
  if (!handle || /\s/.test(v)) return null; // free-text org names are not social links
  return { platform, url: `${SOCIAL_BASE[platform]}${handle}` };
}

function toContact(m: MemberDto): Contact {
  const emails = extractEmails(m.email);
  const phones = extractPhones(m.phone, m.personalPhone, m.delhiPhone);
  const perm = [cleanText(m.permanentFaddr), cleanText(m.permanentLaddr)]
    .filter(Boolean)
    .join(', ');
  const pres = [cleanText(m.presentFaddr), cleanText(m.presentLaddr)].filter(Boolean).join(', ');
  const address = perm || pres || null;
  const socials = [
    social('facebook', m.facebook),
    social('twitter', m.twitter),
    social('instagram', m.instagram),
    social('linkedin', m.linkedIn),
    social('pinterest', m.pinterest),
  ].filter((s): s is Social => s != null);
  return { emails, phones, address, socials };
}

async function main(): Promise<void> {
  const crosswalk = JSON.parse(
    await readFile(new URL('crosswalk.json', CANON), 'utf8'),
  ) as CrosswalkRow[];
  const targets = crosswalk.filter((r) => r.sansad.mpsno != null);
  console.log(`Sansad member-detail fetches: ${targets.length}`);

  await mkdir(RAW, { recursive: true });
  const out: SansadDeepRow[] = [];
  let i = 0;
  for (const r of targets) {
    const mpsno = r.sansad.mpsno as number;
    const m = await fetchJsonOrNull<MemberDto>(MEMBER(mpsno));
    await sleep(SLEEP_MS);
    const contact = m ? toContact(m) : null;
    out.push({
      pc_id: r.pc_id,
      mpsno,
      contact,
      committees: null,
      reachable: { contact: contact != null, committees: false },
      _provenance: PROVENANCE,
    });
    if (++i % FLUSH_EVERY === 0) {
      await writeFile(new URL('sansad_deep.json', RAW), JSON.stringify(out, null, 2));
      console.log(`  ${i}/${targets.length}`);
    }
  }
  await writeFile(new URL('sansad_deep.json', RAW), JSON.stringify(out, null, 2));
  const withEmail = out.filter((r) => (r.contact?.emails.length ?? 0) > 0).length;
  const withPhone = out.filter((r) => (r.contact?.phones.length ?? 0) > 0).length;
  const withAddr = out.filter((r) => r.contact?.address).length;
  const withSocial = out.filter((r) => (r.contact?.socials.length ?? 0) > 0).length;
  console.log(
    `Sansad deep: ${out.length} (email ${withEmail} · phone ${withPhone} · address ${withAddr} · socials ${withSocial})`,
  );
  console.log('Wrote data/raw/sansad_deep.json');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
