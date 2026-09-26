import type { CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
import { categories, categoryColors, categoryGlowColors } from "@/data/creatures";
import { useCreatures } from "@/hooks/useCreatures";
import { motion, useReducedMotion } from "framer-motion";
import { CategoryPortrait } from "@/components/category-portrait";
import { categoryBadges } from "@/data/category-badges";
import { CategoryBadge } from "@/components/category-badge";

function AmphibianBadge() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-[8%] rotate-45 rounded-[22%] border border-white/30 bg-black/10 shadow-[inset_0_0_25px_rgba(0,0,0,.12)]" />
      <svg
        viewBox="0 0 160 160"
        className="relative z-10 w-[88%] h-[88%] text-white drop-shadow-[0_3px_3px_rgba(0,0,0,.25)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Amphibians"
      >
        <path d="M80 25v110" opacity=".55"/>
        <path d="M80 43c-8-10-17-14-27-11-10 3-16 12-14 21 2 8 10 13 20 12-11 5-18 14-18 25 0 8 4 14 11 18"/>
        <path d="M80 43c8-10 17-14 27-11 10 3 16 12 14 21-2 8-10 13-20 12 11 5 18 14 18 25 0 8-4 14-11 18"/>
        <path d="M60 64c3 8 8 13 20 14 12-1 17-6 20-14"/>
        <path d="M80 78c-12 1-20 8-22 20-2 11 4 22 22 31 18-9 24-20 22-31-2-12-10-19-22-20z"/>
        <circle cx="57" cy="49" r="3.2" fill="currentColor" stroke="none"/>
        <circle cx="103" cy="49" r="3.2" fill="currentColor" stroke="none"/>
        <path d="M58 94 39 107 28 105M102 94l19 13 11-2M61 111l-16 17-13 2M99 111l16 17 13 2"/>
        <path d="M28 105l-7-6m7 6-8 1m12 24-7 5m7-5-8-2m108-23 7-6m-7 6 8 1m-12 24 7 5m-7-5 8-2"/>
      </svg>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { creatures } = useCreatures();
  const reducedMotion = useReducedMotion();

  const handleRandom = () => {
    const randomCreature = creatures[Math.floor(Math.random() * creatures.length)];
    if (randomCreature) setLocation(`/creature/${randomCreature.id}`);
  };

  return (
    <Layout>
      <section className="museum-hero relative overflow-hidden rounded-[2rem] border border-[#9a7a46]/20 bg-[#f4ead2]/35 px-6 py-12 md:px-12 md:py-16 mb-14 shadow-[inset_0_1px_0_rgba(255,255,255,.65)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(92,67,37,.18), transparent 30%), radial-gradient(circle at 80% 80%, rgba(92,67,37,.14), transparent 34%)"
          }}
        />
        <div className="museum-orbit museum-orbit-left" aria-hidden="true" />
        <div className="museum-orbit museum-orbit-right" aria-hidden="true" />
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-3 text-[10px] md:text-xs font-semibold uppercase tracking-[0.38em] text-foreground/45">
            A Natural History Collection
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold mb-5 tracking-tight">
            The Encyclopedia of Life
          </h2>
          <div className="w-20 h-px bg-foreground/25 mb-5" />
          <p className="text-lg md:text-xl text-foreground/60 max-w-2xl font-light mb-8 leading-relaxed">
            Discover remarkable life from across Earth's history — from living species to creatures known only from the fossil record.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center rounded-full bg-foreground text-background h-11 px-7 text-sm font-semibold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Browse Collection
            </Link>
            <Button
              variant="outline"
              className="rounded-full h-11 px-7 bg-background/45 border-foreground/20 backdrop-blur-sm"
              onClick={handleRandom}
              data-testid="button-random-creature"
            >
              <Dices className="mr-2 h-4 w-4" />
              Random Creature
            </Button>
          </div>
        </div>
        <div className="museum-collection-note relative mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[.2em] text-foreground/50">
          <span>{creatures.length} creatures catalogued</span><span aria-hidden="true">✦</span><span>{categories.length} exhibition halls</span><span aria-hidden="true">✦</span><span>A world of discovery</span>
        </div>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] font-semibold text-foreground/40 mb-1">
            Collection Halls
          </div>
          <h3 className="text-3xl md:text-4xl font-serif font-bold">Exhibits</h3>
        </div>
        <Link
          href="/mystery"
          className="text-sm font-semibold text-foreground/55 hover:text-foreground transition-colors border-b border-foreground/25 pb-0.5"
        >
          View Mystery Creatures →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {categories.map((category, index) => {
          const count = creatures.filter(c => c.category === category).length;
          const colorClass = categoryColors[category] || "bg-card text-card-foreground";

          return (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.055 }}
              key={category}
              className="h-full"
            >
              <Link
                href={`/browse?category=${encodeURIComponent(category)}`}
                data-testid={`tile-category-${category}`}
                className={`exhibit-tile block h-full group rounded-[1.4rem] ${colorClass}`}
                style={{ "--exhibit-glow": categoryGlowColors[category] || "#9874ba" } as CSSProperties}
              >
                <div className="pointer-events-none absolute inset-[7px] rounded-[1.05rem] border border-white/15" />
                <div className="pointer-events-none absolute left-5 right-5 top-3 h-px bg-white/20" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/15 to-transparent" />

                <div className="relative flex flex-col items-center px-5 pt-6 pb-5">
                  <div className="text-[9px] uppercase tracking-[0.28em] font-bold opacity-55 mb-2">
                    Natural History Exhibit
                  </div>

                  <div className="exhibit-portrait relative w-36 h-36 md:w-40 md:h-40 mb-3">
                    <div className="exhibit-halo absolute inset-[13%] rounded-full blur-xl" />
                    {category === "Amphibians" ? (
                      <AmphibianBadge />
                    ) : categoryBadges[category] ? (
                      <CategoryBadge
                        src={categoryBadges[category]}
                        alt={category}
                        glowColor={categoryGlowColors[category]}
                        className="w-full h-full"
                      />
                    ) : (
                      <CategoryPortrait category={category} className="w-full h-full" />
                    )}
                  </div>

                  <div className="w-10 h-px bg-current opacity-25 mb-3" />

                  <div className="w-full flex items-end justify-between gap-3">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.22em] font-semibold opacity-45 mb-0.5">
                        Hall of
                      </div>
                      <h4 className="text-xl font-bold font-serif leading-none tracking-tight">
                        {category}
                      </h4>
                    </div>

                    <div className="flex flex-col items-center justify-center min-w-10 h-10 rounded-full border border-current/20 bg-black/10 shadow-[inset_0_1px_3px_rgba(0,0,0,.12)]">
                      <span className="text-sm leading-none font-bold">{count}</span>
                      <span className="text-[6px] uppercase tracking-wider opacity-60 mt-0.5">Species</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </Layout>
  );
}
