import museumFossils from "@/assets/museum-fossils.png";
import type { CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
import { categories, categoryColors, categoryGlowColors } from "@/data/creatures";
import { useCreatures } from "@/hooks/useCreatures";
import { motion, useReducedMotion } from "framer-motion";
import { CategoryPortrait } from "@/components/category-portrait";
import { categoryBadges, categoryBadgePanels } from "@/data/category-badges";
import { CategoryBadge } from "@/components/category-badge";

export default function Home() {
  const [, setLocation] = useLocation();
  const { creatures, sharedCount, collectionStatus } = useCreatures();
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
        <div className="museum-fossil-backdrop museum-fossil-left" aria-hidden="true"><img src={museumFossils} alt="" /></div>
        <div className="museum-fossil-backdrop museum-fossil-right" aria-hidden="true"><img src={museumFossils} alt="" /></div>
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-3 text-[10px] md:text-xs font-semibold uppercase tracking-[0.38em] text-foreground/45">
            Woolly · A shared archive of lost life
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold mb-5 tracking-tight">
            Museum of the Extinct
          </h2>
          <div className="w-20 h-px bg-foreground/25 mb-5" />
          <p className="text-lg md:text-xl text-foreground/60 max-w-2xl font-light mb-8 leading-relaxed">
            Step into Earth's lost worlds. Explore extraordinary extinct animals, from the age of dinosaurs to the last dodo.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center rounded-full bg-foreground text-background h-11 px-7 text-sm font-semibold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Browse Collection
            </Link>
            <Button
              variant="outline"
              className="random-creature-button rounded-full min-h-14 h-auto px-7 py-3 text-base border-[#9b7b45]/40"
              onClick={handleRandom}
              data-testid="button-random-creature"
            >
              <span className="random-creature-icon mr-3 inline-flex h-9 w-9 items-center justify-center rounded-full"><Dices className="h-5 w-5" /></span>
              <span className="text-left"><span className="block font-semibold">Random Creature</span><span className="block text-[9px] uppercase tracking-[.2em] font-normal opacity-60 mt-0.5">Let curiosity lead</span></span>
            </Button>
          </div>
        </div>
        <div className="museum-collection-note relative mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[.2em] text-foreground/50">
          <span data-testid="collection-counter">{sharedCount.toLocaleString()} extinct creatures catalogued</span><span aria-hidden="true">✦</span><span>{categories.length} exhibition halls</span><span aria-hidden="true">✦</span><span>A world of discovery</span>
        </div>
      </section>

      {collectionStatus === "offline" && <p className="mb-6 text-sm text-muted-foreground" role="status">Showing the last available collection. Reconnecting to the shared archive…</p>}
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
                    Extinct Life Exhibit
                  </div>

                  <div className="exhibit-portrait relative w-36 h-36 md:w-40 md:h-40 mb-3">
                    <div className="exhibit-halo absolute inset-[13%] rounded-full blur-xl" />
                    {categoryBadges[category] ? (
                      <CategoryBadge
                        src={categoryBadges[category]}
                        panel={categoryBadgePanels[category]}
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
                      <span className="text-[6px] uppercase tracking-wider opacity-60 mt-0.5">Entries</span>
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
