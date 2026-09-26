import { ImageViewer } from "@/components/image-viewer";
import { useRoute } from "wouter";
import { Layout } from "@/components/layout";
import {
  categoryEmojis, categoryColors, categoryBgColors, categoryGlowColors,
  type Creature,
} from "@/data/creatures";
import { useCreatures } from "@/hooks/useCreatures";
import { useWikipediaImage } from "@/hooks/useWikipediaImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Info, Clock, MapPin, Utensils, Ruler, ExternalLink, Shuffle, Maximize2 } from "lucide-react";
import NotFound from "./not-found";
import { motion } from "framer-motion";
import { WorldMap } from "@/components/world-map";

/* ─── Helpers ────────────────────────────────────────────────── */

function myaToSentence(mya: string): string {
  const lower = mya.toLowerCase().trim();
  if (!lower || lower === "present" || lower === "extant") return "Living today";
  if (lower.startsWith("extinct")) {
    const year = mya.replace(/extinct\s*/i, "").trim();
    return year ? `Extinct — last seen approximately ${year}` : "Recently extinct";
  }
  const nums = (mya.match(/[\d.]+/g) ?? []).map(Number).filter((n) => !isNaN(n) && n > 0);
  if (nums.length === 0) return mya;
  const max = Math.max(...nums);
  if (max > 700) return `Extinct — last seen approximately ${Math.round(max)}`;
  const fmtMa = (n: number): string => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")} billion years ago`;
    if (n >= 1) return `${n.toLocaleString()} million years ago`;
    return `${Math.round(n * 1_000_000).toLocaleString()} years ago`;
  };
  const a = Math.max(...nums), b = Math.min(...nums);
  if (a === b) return `Lived approximately ${fmtMa(a)}`;
  if (a < 1000 && b >= 1) return `Lived approximately ${b.toLocaleString()} to ${a.toLocaleString()} million years ago`;
  return `Lived approximately ${fmtMa(b)} to ${fmtMa(a)}`;
}

const MYSTERY_LABELS: Record<number, string> = {
  1: "Some fossil gaps",
  2: "Very little known",
  3: "Almost unknown",
};

/* ─── Category placeholder (no Wikipedia image) ─────────────── */

function CategoryPlaceholder({ category }: { category: string }) {
  const emoji = categoryEmojis[category] ?? "🦴";
  const gradient = categoryBgColors?.[category] ?? "from-slate-800 to-slate-950";
  return (
    <div className={`w-full h-full bg-gradient-to-b ${gradient} flex flex-col items-center justify-center gap-4 select-none`}>
      <span className="text-9xl opacity-20 drop-shadow-xl">{emoji}</span>
    </div>
  );
}

/* ─── Hero image with name overlay ──────────────────────────── */

function HeroImage({ creature }: { creature: Creature }) {
  const imgState = useWikipediaImage(creature.name, creature.genus);

  return (
    <div className="relative w-full h-80 md:h-[26rem] overflow-hidden rounded-t-3xl bg-slate-950">
      {imgState.status === "loading" && <Skeleton className="w-full h-full rounded-none" />}

      {imgState.status === "not-found" && <CategoryPlaceholder category={creature.category} />}

      {imgState.status === "found" && (
        <ImageViewer image={imgState} name={creature.name}>
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0 w-full h-full group/image cursor-zoom-in text-left"
          aria-label={`View full image of ${creature.name}`}
        >
          <img src={imgState.url} onError={e => { if (imgState.originalUrl && e.currentTarget.src !== imgState.originalUrl) e.currentTarget.src = imgState.originalUrl; }} alt={creature.name} className="w-full h-full object-cover object-center" />
          <span className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white/85 opacity-100 md:opacity-0 md:group-hover/image:opacity-100 md:group-focus-visible/image:opacity-100 transition-opacity backdrop-blur-sm">
            <Maximize2 className="w-3.5 h-3.5" /> View full image
          </span>
        </motion.button>
        </ImageViewer>
      )}

      {/* Deep fade: image dissolves into card background */}
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-card via-card/85 to-transparent pointer-events-none" />

      {/* Subtle top vignette */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

      {/* Name / genus overlay */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 px-8 md:px-12 pb-7">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className={`${categoryColors[creature.category]} border-0 px-3 py-1 text-sm backdrop-blur-sm`}
          >
            {creature.category}
          </Badge>
          {creature.mysteryLevel > 0 && (
            <Badge
              variant="outline"
              className={`${creature.mysteryLevel === 3 ? "bg-purple-900/80 text-purple-100" : "bg-amber-600/80 text-white"} border-0 px-3 py-1 text-sm backdrop-blur-sm`}
            >
              Mystery: {MYSTERY_LABELS[creature.mysteryLevel]}
            </Badge>
          )}
        </div>

        <h1
          className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-white drop-shadow-xl"
          data-testid="text-creature-name"
        >
          {creature.name}
        </h1>
        <p className="text-xl text-white/60 italic font-serif mt-1 drop-shadow">
          {creature.genus}
        </p>
        <p className="text-sm text-white/40 font-serif italic mt-1">
          {myaToSentence(creature.mya)}
        </p>
      </div>

      {/* Wikipedia credit */}
      {imgState.status === "found" && (
        <a
          href={(imgState as { status: "found"; url: string; pageUrl: string }).pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors z-10"
        >
          <ExternalLink className="w-3 h-3" />
          Wikipedia
        </a>
      )}
    </div>
  );
}

/* ─── Main detail page ───────────────────────────────────────── */

export default function CreatureDetail() {
  const [, params] = useRoute("/creature/:id");
  const { creatures } = useCreatures();
  const creature = creatures.find((c) => c.id === params?.id);

  if (!creature) return <NotFound />;

  const glowColor = categoryGlowColors[creature.category];

  const handleRandom = () => {
    if (creatures.length === 0) return;
    const others = creatures.filter((c) => c.id !== creature.id);
    const pool = others.length > 0 ? others : creatures;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    window.location.href = `/creature/${pick.id}`;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-card text-card-foreground rounded-3xl overflow-hidden border shadow-sm mb-8">

          {/* Hero — name overlaid on Wikipedia image */}
          <HeroImage creature={creature} />

          <div className="px-8 md:px-12 pb-12 pt-6">

            {/* Category accent bar */}
            <div className={`h-1 rounded-full mb-8 ${categoryColors[creature.category]?.split(" ")[0] ?? "bg-slate-600"}`} />

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 p-5 rounded-2xl mb-8">
              {[
                { icon: Clock,   label: "Era",     value: creature.era },
                { icon: Utensils,label: "Diet",    value: creature.diet },
                { icon: Ruler,   label: "Size",    value: creature.size },
                { icon: MapPin,  label: "Habitat", value: creature.habitat },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs text-card-foreground/50 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Icon className="w-3 h-3" /> {label}
                  </span>
                  <span className="font-medium text-card-foreground">{value}</span>
                </div>
              ))}
            </div>

            <Separator className="my-8 opacity-20" />

            <div className="grid md:grid-cols-3 gap-12">
              {/* Left column */}
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2 text-card-foreground">
                    <Info className="w-6 h-6 text-card-foreground/50" /> Overview
                  </h2>
                  <p className="text-lg leading-relaxed text-card-foreground/80">
                    {creature.description}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-serif font-bold mb-4 text-card-foreground">Where it lived</h2>
                  <WorldMap
                    regions={creature.regions}
                    habitat={creature.habitat}
                    glowColor={glowColor}
                    mya={creature.mya}
                  />
                </section>
              </div>

              {/* Right column */}
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-serif font-bold mb-4 text-card-foreground">Fun Facts</h2>
                  <ul className="space-y-3">
                    {creature.funFacts.map((fact, i) => (
                      <li key={i} className="flex gap-3">
                        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${categoryColors[creature.category]}`}>
                          {i + 1}
                        </span>
                        <span className="leading-snug text-card-foreground/75">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-serif font-bold mb-4 text-card-foreground">
                    Living Relatives &amp; Family
                  </h2>
                  <div className="space-y-2">
                    {creature.family.map((relative, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="font-medium text-card-foreground">{relative.name}</span>
                        <span className="flex items-center gap-1.5 text-xs text-card-foreground/60 uppercase tracking-wider font-semibold">
                          {relative.living ? (
                            <><span className="w-2 h-2 rounded-full bg-green-400" />Living</>
                          ) : (
                            <><span className="w-2 h-2 rounded-full bg-stone-400" />Extinct</>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Random creature button */}
            <div className="mt-12 pt-8 border-t border-white/10 flex justify-center">
              <Button
                variant="outline"
                onClick={handleRandom}
                className="gap-2 px-8 py-5 text-base font-serif"
              >
                <Shuffle className="w-4 h-4" />
                Random Creature
              </Button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
