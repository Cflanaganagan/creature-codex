import { Link } from "wouter";
import { Search, Database, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-2 no-underline">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary group-hover:scale-105 transition-transform duration-300">
                <path d="M20 50C20 35 35 20 50 20C65 20 80 35 80 50C80 65 65 80 50 80C35 80 20 65 20 50Z" stroke="currentColor" strokeWidth="4" strokeDasharray="8 4"/>
                <path d="M40 45C40 40 45 35 50 35C55 35 60 40 60 45C60 50 55 55 50 55C45 55 40 50 40 45Z" fill="currentColor"/>
                <path d="M30 65C40 60 60 60 70 65" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-serif font-bold tracking-tight text-primary m-0">Every Creature</h1>
          </Link>

          <div className="flex items-center gap-1 w-full sm:w-auto">
            <div className="w-full sm:w-72 relative mr-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <form action="/browse">
                <Input
                  name="q"
                  type="search"
                  placeholder="Search creatures..."
                  className="pl-10 w-full rounded-full bg-muted/50 border-transparent focus:bg-background transition-colors"
                  data-testid="input-header-search"
                />
              </form>
            </div>

            <Link
              href="/timeline"
              data-testid="link-timeline"
              className="shrink-0 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-3 py-2 rounded-full hover:bg-muted/50"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </Link>

            <Link
              href="/import"
              data-testid="link-import"
              className="shrink-0 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-3 py-2 rounded-full hover:bg-muted/50"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t bg-muted/30 py-12 text-center text-muted-foreground">
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
