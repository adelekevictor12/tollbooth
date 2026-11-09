import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tollbooth — APIs with a cash register for AI agents",
  description:
    "Publish any API as a typed SDK + agent-readable context (APIMatic), and let AI agents discover and pay for it per call through PayPal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased min-h-screen flex flex-col`}>
        <header className="border-b border-neutral-800 sticky top-0 z-10 bg-neutral-950/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24]" />
              Tollbooth
            </Link>
            <nav className="flex items-center gap-6 text-sm text-neutral-400">
              <Link href="/" className="hover:text-amber-400 transition-colors">Marketplace</Link>
              <Link href="/dev" className="hover:text-amber-400 transition-colors">Developer</Link>
              <a
                href="https://github.com/"
                className="hover:text-amber-400 transition-colors"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
          Tollbooth · PayPal AI Hackathon 2026 · agent-to-machine commerce, metered by PayPal
        </footer>
      </body>
    </html>
  );
}
