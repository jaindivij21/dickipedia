import Link from 'next/link';
import { MpBrowser } from '@/components/mp/browse/MpBrowser';
import { SLIM_MPS, parties, states } from '@/lib/mp/data';

export const metadata = {
  title: 'Lok Sabha MPs — dickipedia',
  description: 'The sourced public record of all 543 members of the 18th Lok Sabha (2024).',
};

export default function MpIndex() {
  return (
    <main className='mx-auto max-w-5xl px-4'>
      <nav className='eyebrow pt-6'>
        <Link href='/' className='hover:text-ink'>
          dickipedia
        </Link>{' '}
        / Lok Sabha MPs
      </nav>
      <header className='rule-top mt-3 pt-5 pb-8'>
        <h1 className='text-3xl font-bold sm:text-4xl'>Lok Sabha MPs</h1>
        <p className='text-ink-soft mt-3 max-w-2xl leading-relaxed'>
          All {SLIM_MPS.length} members of the 18th Lok Sabha, ranked by an accountability score
          built from sworn affidavits, attendance, parliamentary work, and fund use. Every figure on
          a member&rsquo;s page traces to a public source.
        </p>
      </header>
      <MpBrowser mps={SLIM_MPS} parties={parties()} states={states()} />
    </main>
  );
}
