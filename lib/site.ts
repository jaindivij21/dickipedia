import type { Metadata } from 'next';

export const SITE = {
  name: 'dickipedia',
  url: 'https://dickipedia.in',
  title: "dickipedia — the public record of India's powerful",
  description:
    'An open, sourced encyclopedia of public power: every office-holder traced to a public registry, every figure cited, no accusations authored.',
  titleTemplate: '%s · dickipedia',
  ogImage: '/og.jpg',
  ogImageAlt: 'dickipedia — the sourced encyclopedia of public power',
  locale: 'en_IN',
  keywords: [
    'dickipedia',
    'public records',
    'accountability',
    'encyclopedia of public power',
    'Lok Sabha',
    'Members of Parliament',
    'India elections',
    'electoral affidavits',
    'MPLADS',
    'PRS Legislative Research',
    'MyNeta',
  ],
} as const;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

type PageMeta = { title?: string; description?: string; path?: string };

export function buildMetadata({ title, description, path = '/' }: PageMeta = {}): Metadata {
  const desc = description ?? SITE.description;
  const ogTitle = title ?? SITE.title;
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      url: path,
      title: ogTitle,
      description: desc,
      locale: SITE.locale,
      images: [{ url: SITE.ogImage, width: OG_WIDTH, height: OG_HEIGHT, alt: SITE.ogImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: desc,
      images: [SITE.ogImage],
    },
  };
}
