import type { CSSProperties } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
import { categories, categoryColors, categoryGlowColors } from "@/data/creatures";
import { useCreatures } from "@/hooks/useCreatures";
import { motion } from "framer-motion";
import { CategoryPortrait } from "@/components/category-portrait";
import { categoryBadges } from "@/data/category-badges";
import { CategoryBadge } from "@/components/category-badge";

export default function Home() {
  const [, setLocation] = useLocation();
  const { creatures } = useCreatures();

  const handleRandom = () => {
    const randomCreature = creatures[Math.floor(Math.random() * creatures.length)];
    setLocation(`/creature/${randomCreature.id}`);
  };

  return (
    <Layout>
      <div className="flex flex-col items-center text-center mb-16 pt-8">
        <h2 className="text-5xl md:text-6xl font-serif font-bold mb-4 tracking-tight">The Encyclopedia of Life</h2>
        <p className="text-xl text-foreground/60 max-w-2xl font-light mb-8">
          Explore the fascinating prehistoric creatures that once roamed our planet, from the colossal sauropods to the enigmatic mystery fossils.
        </p>

        <div className="flex gap-4">
          <Link href="/browse" className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2">
            Browse Collection
          </Link>
          <Button variant="outline" className="rounded-full" onClick={handleRandom} data-testid="button-random-creature">
            <Dices className="mr-2 h-4 w-4" />
            Random Creature
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-serif font-bold">Exhibits</h3>
        <Link href="/mystery" className="text-purple-600 hover:text-purple-800 font-medium transition-colors underline underline-offset-4">
          View Mystery Creatures →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category, index) => {
          const count = creatures.filter(c => c.category === category).length;
          const colorClass = categoryColors[category] || "bg-card text-card-foreground";

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={category}
            >
              <Link
                href={`/browse?category=${encodeURIComponent(category)}`}
                data-testid={`tile-category-${category}`}
                className={`exhibit-tile block h-full group rounded-xl ${colorClass}`}
                style={{ "--exhibit-glow": categoryGlowColors[category] || "#a78bfa" } as CSSProperties}
              >
                <div className="flex flex-col items-center gap-4 p-6 pb-5">
                  {/* Badge image (user-provided) or SVG diamond portrait fallback */}
                  <div className="exhibit-portrait relative w-36 h-36">
                    {categoryBadges[category] ? (
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

                  {/* Name + count */}
                  <div className="w-full flex items-end justify-between">
                    <h4 className="text-lg font-bold font-serif leading-tight">{category}</h4>
                    <span className="shrink-0 inline-flex items-center rounded-full bg-black/20 px-2.5 py-0.5 text-xs font-semibold ml-2">
                      {count}
                    </span>
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
