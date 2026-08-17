import "../styles/globals.css";
import Link from "next/link";

export default function App({ Component, pageProps }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-paper sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl tracking-tight">
            PathGraph
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-accent">Courses</Link>
            <Link href="/path" className="hover:text-accent">Connect Courses</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
