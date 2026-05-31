import { notFound } from 'next/navigation';
import { allSlugs, getParty } from '@/lib/mp/data';
import { loadMp } from '@/lib/mp/loader';
import { buildMetadata } from '@/lib/site';
import { MpHeader } from '@/components/mp/MpHeader';
import { ElectionSection } from '@/components/mp/ElectionSection';
import { WorkSection } from '@/components/mp/WorkSection';
import { NotableRecordSection } from '@/components/mp/NotableRecordSection';
import { PressSection } from '@/components/mp/PressSection';
import { WealthSection } from '@/components/mp/WealthSection';
import { AffidavitSection } from '@/components/mp/AffidavitSection';
import { MpladsSection } from '@/components/mp/MpladsSection';
import { PartyFundingSection } from '@/components/mp/PartyFundingSection';
import { InferencesSection } from '@/components/mp/InferencesSection';
import { ContactSection } from '@/components/mp/ContactSection';
import { NewsSection } from '@/components/mp/NewsSection';
import { SourcesSection } from '@/components/mp/SourcesSection';
import { MpInfobox } from '@/components/mp/MpInfobox';

export const dynamicParams = false;
export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await loadMp(slug);
  if (!m) return buildMetadata({ title: 'Not found', path: `/mp/${slug}` });
  return buildMetadata({
    title: `${m.mp_name} — ${m.pc_name} (${m.party})`,
    description: `Accountability record for ${m.mp_name}, MP for ${m.pc_name}, ${m.eci_state}. Score ${m.accountability_score ?? '?'} / 100. Public records only.`,
    path: `/mp/${slug}`,
  });
}

export default async function MpPage({ params }: { params: Promise<{ slug: string }> }) {
  const m = await loadMp((await params).slug);
  if (!m) notFound();
  const party = getParty(m.party);

  return (
    <main className='mx-auto max-w-6xl px-4 pb-16'>
      <MpHeader mp={m} />
      <div className='grid gap-x-10 lg:grid-cols-[1fr_320px]'>
        <div className='min-w-0'>
          <ElectionSection mp={m} />
          <WorkSection mp={m} />
          <NotableRecordSection mp={m} />
          <PressSection mp={m} />
          <WealthSection mp={m} />
          <AffidavitSection mp={m} />
          <MpladsSection mp={m} />
          <PartyFundingSection party={party} />
          <InferencesSection mp={m} />
          <ContactSection mp={m} />
          <NewsSection mp={m} />
          <SourcesSection />
        </div>
        <MpInfobox mp={m} />
      </div>
    </main>
  );
}
