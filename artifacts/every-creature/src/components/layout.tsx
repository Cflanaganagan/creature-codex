import { Link } from "wouter";
import { Clock } from "lucide-react";
import { CreatureSearch } from "@/components/creature-search";
import codexLogo from "@/assets/creature-codex-logo.png";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="museum-page min-h-[100dvh] flex flex-col">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="museum-header border-b sticky top-0 z-30">
        <div className="container max-w-7xl mx-auto px-5 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2 no-underline">
            <div className="w-11 h-11 relative flex items-center justify-center overflow-hidden rounded-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
              <img src={codexLogo} alt="Creature Codex home" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-primary m-0">Every Creature</h1>
          </Link>

          <div className="flex items-center gap-1 w-full sm:w-auto">
            <div className="w-full sm:w-72 relative mr-2">
              <CreatureSearch />
            </div>

            <Link
              href="/timeline"
              data-testid="link-timeline"
              className="shrink-0 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-3 py-2 rounded-full hover:bg-muted/50"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </Link>


          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 container max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-10">
        {children}
      </main>

      <footer className="museum-footer border-t py-12 text-center text-muted-foreground">
        <p className="font-serif italic text-lg mb-2">A natural history museum in your pocket.</p>
        <p className="text-sm">
          Built for curiosity.{" "}
          <Link href="/import" className="underline underline-offset-2 hover:text-foreground transition-colors">
            Manage database
          </Link>
        </p>
      </footer>
    </div>
  );
}
