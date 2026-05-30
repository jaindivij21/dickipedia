import type { Metadata } from "next";
import { Space_Mono, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ScanFace } from "lucide-react";
import "./globals.css";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono" });
const jet = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "dickipedia — the people's record of their representatives",
  description: "An open, sourced accountability record of India's elected Lok Sabha MPs. Public records only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${jet.variable}`}>
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 bg-surface/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="group flex items-center gap-3">
              <span className="neu-raised-sm grid h-10 w-10 place-items-center rounded-2xl text-primary">
                <ScanFace size={20} strokeWidth={2.25} />
              </span>
              <span className="text-lg font-bold tracking-tight">
                dicki<span className="text-primary">pedia</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-xs">
              <Link href="/" className="neu-flat neu-press rounded-xl px-3 py-2 font-bold">MPs</Link>
              <span className="neu-inset-sm rounded-xl px-3 py-2 text-ink-soft">18th Lok Sabha</span>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-ink-soft">
          <div className="neu-inset rounded-2xl p-5 leading-relaxed">
            <p className="font-bold text-ink">Public records only. The site reports facts and cites every one.</p>
            <p className="mt-1">Sources: Election Commission of India · PRS Legislative Research · Lok Sabha Secretariat · ADR/MyNeta · MPLADS-eSAKSHI · ECI/SBI electoral-bond disclosure. Criminal data shown as self-declared in sworn affidavits (pending ≠ convicted). Open data under ODbL-1.0; code MIT.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
