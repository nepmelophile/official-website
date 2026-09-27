import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

/** Public site chrome: skip link → header → main#main → footer. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only rounded-pill bg-highlight px-5 py-3 text-sm font-semibold text-highlight-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:shadow-glow"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
