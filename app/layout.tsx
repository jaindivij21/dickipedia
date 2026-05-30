import type { Metadata } from 'next';
import { Gelasio, Ubuntu_Mono } from 'next/font/google';
import Link from 'next/link';
import { Stamp, ArrowUpRight } from 'lucide-react';
import './globals.css';

const gelasio = Gelasio({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-gelasio',
});
const ubuntuMono = Ubuntu_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ubuntu-mono',
});

export const metadata: Metadata = {
  title: "dickipedia — the public record of India's powerful",
  description:
    'An open, sourced encyclopedia that holds India’s public officials to their own public record.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${gelasio.variable} ${ubuntuMono.variable}`}>
      <body className='min-h-screen'>
        <header className='border-ink relative border-b'>
          <div className='mx-auto flex max-w-5xl items-center justify-between px-4 py-4'>
            <Link href='/' className='group relative flex items-center gap-2 leading-none'>
              <Stamp
                size={22}
                strokeWidth={2.25}
                className='text-accent shrink-0 transition-transform group-hover:-rotate-6 motion-reduce:transition-none'
              />
              <span className='leading-none'>
                <span className='block text-2xl font-bold tracking-tight lowercase'>
                  <span className='text-accent'>d</span>ickipedia
                </span>
                <span className='eyebrow mt-1 hidden sm:block'>
                  The public record of India&rsquo;s powerful
                </span>
              </span>
            </Link>
            <nav>
              <a
                href='https://github.com/jaindivij21/dickipedia'
                target='_blank'
                rel='noopener noreferrer'
                className='eyebrow hover:text-ink -my-3 inline-flex items-center gap-1 py-3'
              >
                Contribute
                <ArrowUpRight size={12} />
              </a>
            </nav>
          </div>
          <span aria-hidden className='bg-accent absolute bottom-[-1px] left-4 h-0.5 w-12' />
        </header>
        {children}
        <footer className='border-border mx-auto mt-12 max-w-5xl border-t px-4 py-8'>
          <p className='text-sm font-semibold'>
            Public records only. The site reports facts and cites every one.
          </p>
          <p className='text-ink-soft mt-1.5 text-xs leading-relaxed'>
            Sources: Election Commission of India · PRS Legislative Research · Lok Sabha Secretariat
            · ADR/MyNeta · MPLADS-eSAKSHI · ECI/SBI electoral-bond disclosure. Criminal data shown
            as self-declared in sworn affidavits (pending &ne; convicted). Open data under ODbL-1.0;
            code MIT.
          </p>
        </footer>
      </body>
    </html>
  );
}
