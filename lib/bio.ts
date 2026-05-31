import type { Mp } from '@/lib/data';
import { SRC_KEYS, type SrcKey } from '@/lib/sources';
import { ordinal } from '@/lib/format';

export interface Lede {
  sentences: string[];
  sources: SrcKey[];
}

const TERM_WORDS = [
  '',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
  'tenth',
];
const MAX_COMMITTEES = 3;

function termWord(n: number): string {
  return TERM_WORDS[n] ?? ordinal(n);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function isIndependent(mp: Mp): boolean {
  return mp.party === 'IND' || /independent/i.test(mp.party_full);
}

export function buildLede(mp: Mp): Lede {
  const sources = new Set<SrcKey>(['eci']);
  const sentences: string[] = [];

  const hasTerms = mp.terms != null && mp.terms > 0;
  const lead = hasTerms
    ? `${mp.mp_name}, a ${termWord(mp.terms as number)}-term Member of Parliament, represents`
    : `${mp.mp_name} represents`;
  if (hasTerms) sources.add('sansad');
  const affiliation = isIndependent(mp) ? ' as an Independent' : ` for the ${mp.party_full}`;
  const office = mp.minister ? ', and serves as a Union Minister' : '';
  if (mp.minister) sources.add('prs');
  sentences.push(
    `${lead} ${mp.pc_name}, ${mp.eci_state} in the 18th Lok Sabha${affiliation}${office}.`,
  );

  const recorded: string[] = [];
  if (mp.profession) recorded.push(`profession as ${mp.profession}`);
  if (mp.qualification) recorded.push(`qualification as ${mp.qualification}`);
  if (recorded.length) {
    sources.add('sansad');
    sentences.push(`The public record lists ${joinList(recorded)}.`);
  }

  if (mp.committees && mp.committees.length) {
    sources.add('sansad');
    const names = mp.committees.map((c) => c.name);
    const shown = names.slice(0, MAX_COMMITTEES);
    const extra = names.length - shown.length;
    const list =
      extra > 0
        ? `${joinList(shown)} and ${extra} other committee${extra === 1 ? '' : 's'}`
        : joinList(shown);
    sentences.push(`Serves on ${list}.`);
  }

  return {
    sentences: sentences.map((s) => s.replace(/\s{2,}/g, ' ')),
    sources: SRC_KEYS.filter((k) => sources.has(k)),
  };
}
