import { useState } from "react";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkles, AlertCircle, Clock, Utensils, Ruler, MapPin, ExternalLink, CheckCircle2 } from "lucide-react";
import { categories, categoryEmojis, categoryColors, categoryBgColors, type Creature } from "@/data/creatures";
import { useCreatures } from "@/hooks/useCreatures";
import { useAiCreatureLookup } from "@workspace/api-client-react";
import { useWikipediaImage } from "@/hooks/useWikipediaImage";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { DodoLoader } from "@/components/dodo-loader";

type AIResult = Omit<Creature, "id"> & { isUnknown?: boolean };

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const FICTIONAL_PATTERNS = [
  /\b(pikachu|charizard|mewtwo|eevee|bulbasaur|squirtle|pokemon|pokémon)\b/i,
  /\b(mario|luigi|bowser|koopa|yoshi|wario|waluigi)\b/i,
  /\b(zelda|ganondorf|link|hyrule)\b/i,
  /\b(naruto|goku|vegeta|sasuke|luffy|frieza|dragonball)\b/i,
  /\b(minecraft|creeper|enderman|herobrine)\b/i,
  /\b(fortnite|roblox|among us)\b/i,
  /\b(sonic|tails|knuckles|eggman)\b/i,
  /\b(godzilla|mothra|ghidorah|kaiju)\b/i,
  /\b(smaug|balrog|nazgul|sauron)\b/i,
  /\b(voldemort|dementor|hippogriff|thestral)\b/i,
  /\b(megatron|optimus prime|bumblebee)\b/i,
  /\b(xenomorph|predator|facehugger)\b/i,
];

function isObviouslyFictional(query: string): boolean {
  return FICTIONAL_PATTERNS.some((p) => p.test(query));
}

const FAKE_SIGNALS = [
  "fictional", "not a real", "no evidence", "does not exist",
  "made up", "fantasy", "imaginary", "not real", "never existed",
];

function isValidCreatureResponse(data: AIResult, _query: string): boolean {
  const genus = (data.genus ?? "").trim();
  if (!genus || /^unknown$/i.test(genus)) return false;

  const validFacts = (data.funFacts ?? []).filter((f) => typeof f === "string" && f.trim().length > 10);
  if (validFacts.length < 3) return false;

  const desc = (data.description ?? "").toLowerCase();
  if (FAKE_SIGNALS.some((s) => desc.includes(s))) return false;

  return true;
}

function CardThumbnail({ name, category }: { name: string; category: string }) {
  const imgState = useWikipediaImage(name);
  const gradient = categoryBgColors?.[category] ?? "from-slate-800 to-slate-950";
  const emoji = categoryEmojis[category] ?? "🦎";

  if (imgState.status === "loading") {
    return <Skeleton className="w-14 h-14 rounded-lg shrink-0" />;
  }
  if (imgState.status === "not-found") {
    return (
      <div className={`w-14 h-14 rounded-lg bg-gradient-to-b ${gradient} flex items-center justify-center shrink-0`}>
        <span className="text-xl opacity-40">{emoji}</span>
      </div>
    );
  }
  return (
    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900">
      <img src={imgState.url} alt={name} className="w-full h-full object-cover" />
    </div>
  );
}

function AIHeroImage({ name, category }: { name: string; category: string }) {
  const imgState = useWikipediaImage(name);
  const emoji = categoryEmojis[category] ?? "🦎";
  const gradient = categoryBgColors?.[category] ?? "from-slate-800 to-slate-950";

  return (
    <div className="relative w-full h-56 md:h-72 overflow-hidden rounded-t-3xl bg-slate-950">
      {imgState.status === "loading" && (
        <Skeleton className="w-full h-full rounded-none" />
      )}
      {imgState.status === "not-found" && (
        <div className={`w-full h-full bg-gradient-to-b ${gradient} flex items-center justify-center`}>
          <span className="text-8xl opacity-25">{emoji}</span>
        </div>
      )}
      {imgState.status === "found" && (
        <motion.img
          src={imgState.url}
          alt={name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full object-contain"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/50 to-transparent pointer-events-none" />
      {imgState.status === "found" && (
        <a
          href={(imgState as { status: "found"; url: string; pageUrl: string }).pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-3 flex items-center gap-1 text-[11px] text-white/50 hover:text-white/80 transition-colors z-10"
        >
          <ExternalLink className="w-3 h-3" />
          Image: Wikipedia
        </a>
      )}
    </div>
  );
}

export default function Browse() {
  const { creatures, importCreatures } = useCreatures();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || null;
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [invalidResponse, setInvalidResponse] = useState(false);

  const { mutate: lookupAI, isPending: isDiscovering, isError } = useAiCreatureLookup({
    mutation: {
      onSuccess: (data) => {
        const result = data as AIResult;

        if (!isValidCreatureResponse(result, query)) {
          setInvalidResponse(true);
          setAiResult(null);
          return;
        }

        setAiResult(result);
        const id = toSlug(result.name);
        const creature: Creature = {
          ...result,
          id,
          mysteryLevel: result.mysteryLevel as 0 | 1 | 2 | 3,
        };
        importCreatures([creature], "merge");
        setSavedId(id);
      },
      onError: () => {
        setAiResult(null);
      },
    },
  });

  const filteredCreatures = creatures.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase()) || c.genus.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory ? c.category === selectedCategory : true;
    return matchesQuery && matchesCategory;
  });

  const hasQuery = query.trim().length > 1;
  const showAISection = filteredCreatures.length === 0 && hasQuery && !selectedCategory;

  const handleDiscover = () => {
    const term = query.trim();
    if (isObviouslyFictional(term)) {
      setInvalidResponse(true);
      setAiResult(null);
      return;
    }
    setAiResult(null);
    setSavedId(null);
    setInvalidResponse(false);
    lookupAI({ data: { name: term } });
  };

  const mysteryLabels: Record<number, string | null> = {
    0: null,
    1: "Some fossil gaps",
    2: "Very little known",
    3: "Almost unknown",
  };

  return (
    <Layout>
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold mb-6">Browse Collection</h1>

        <div className="flex flex-col gap-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or genus..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setAiResult(null);
                setSavedId(null);
                setInvalidResponse(false);
              }}
              className="pl-10 text-lg py-6 rounded-xl border-border bg-card/5 focus-visible:ring-primary"
              data-testid="input-search"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer text-sm py-1 px-3"
              onClick={() => setSelectedCategory(null)}
              data-testid="filter-all"
            >
              All Categories
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`cursor-pointer text-sm py-1 px-3 ${selectedCategory === cat ? categoryColors[cat] : ""} hover:opacity-80 transition-opacity`}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                data-testid={`filter-${cat}`}
              >
                {categoryEmojis[cat]} {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {filteredCreatures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCreatures.map((creature, i) => (
            <motion.a
              href={`/creature/${creature.id}`}
              key={creature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group block bg-card text-card-foreground rounded-2xl overflow-hidden border border-card-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              data-testid={`card-creature-${creature.id}`}
            >
              <div className={`h-2 ${categoryColors[creature.category]}`} />
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <CardThumbnail name={creature.name} category={creature.category} />
                  <Badge variant="secondary" className="bg-white/15 text-white/90 hover:bg-white/25 text-xs font-medium border-0">
                    {creature.era}
                  </Badge>
                </div>
                <h3 className="text-2xl font-serif font-bold mb-1 text-card-foreground">{creature.name}</h3>
                <p className="italic text-card-foreground/60 mb-4 font-serif">{creature.genus}</p>
                <div className="flex items-center">
                  <Badge variant="outline" className={`text-xs border-0 ${categoryColors[creature.category]}`}>
                    {creature.category}
                  </Badge>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {showAISection ? (
            <motion.div
              key="ai-section"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* No results prompt */}
              <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed">
                <h3 className="text-2xl font-serif text-foreground/70 mb-2">
                  Not in our collection yet
                </h3>
                <p className="text-foreground/60 mb-6">
                  No specimen found for <span className="font-semibold text-foreground">"{query}"</span>. Let our AI naturalist investigate.
                </p>
                <Button
                  onClick={handleDiscover}
                  disabled={isDiscovering}
                  className="gap-2 px-6 py-5 text-base"
                >
                  <Sparkles className="w-4 h-4" />
                  {isDiscovering ? "Discovering creature..." : "Discover with AI"}
                </Button>
              </div>

              {/* Loading state — dodo walking animation */}
              <AnimatePresence>
                {isDiscovering && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <DodoLoader />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error state */}
              {isError && !isDiscovering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Could not reach the AI naturalist. Please try again.</p>
                </motion.div>
              )}

              {/* Invalid / fictional creature */}
              <AnimatePresence>
                {invalidResponse && !isDiscovering && (
                  <motion.div
                    key="invalid"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-10 px-6 rounded-2xl bg-muted/40 border border-dashed text-center"
                  >
                    <span className="text-5xl opacity-50">🦴</span>
                    <h3 className="text-xl font-serif font-semibold text-foreground/70">
                      Not found in the fossil record
                    </h3>
                    <p className="text-sm text-foreground/50 max-w-sm leading-relaxed font-serif italic">
                      Our palaeontologists couldn't locate <span className="font-semibold not-italic text-foreground/70">"{query}"</span> in the archives. It may be fictional, misspelled, or simply lost to deep time.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI Result card */}
              <AnimatePresence>
                {aiResult && !isDiscovering && (
                  <motion.div
                    key="ai-result"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="bg-card text-card-foreground rounded-3xl overflow-hidden border shadow-sm"
                  >
                    {aiResult.isUnknown || aiResult.mysteryLevel === 3 ? (
                      /* Unknown / mystery creature */
                      <div className="p-10 text-center">
                        <div className="text-6xl mb-4">❓</div>
                        <h3 className="text-3xl font-serif font-bold mb-3 text-card-foreground">This creature remains a mystery...</h3>
                        <p className="text-card-foreground/70 max-w-md mx-auto leading-relaxed">
                          {aiResult.description}
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 text-purple-300 text-sm font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Generated
                        </div>
                        {savedId && (
                          <div className="mt-4">
                            <a
                              href={`/creature/${savedId}`}
                              className="inline-flex items-center gap-2 text-sm text-card-foreground/60 hover:text-card-foreground transition-colors underline underline-offset-2"
                            >
                              View full profile →
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Full creature profile */
                      <>
                        <AIHeroImage name={aiResult.name} category={aiResult.category} />

                        <div className="p-8 md:p-10 -mt-2">
                          <div className={`h-1 rounded-full mb-8 ${categoryColors[aiResult.category]?.split(" ")[0] ?? "bg-purple-700"}`} />

                          {/* Header */}
                          <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                            <div className="text-7xl md:text-8xl shrink-0 bg-white/5 p-5 rounded-3xl aspect-square flex items-center justify-center">
                              {categoryEmojis[aiResult.category] || "🦎"}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                <Badge variant="outline" className={`${categoryColors[aiResult.category] || "bg-purple-800 text-white"} border-0 px-3 py-1 text-sm`}>
                                  {aiResult.category}
                                </Badge>
                                {aiResult.mysteryLevel > 0 && (
                                  <Badge variant="outline" className="bg-amber-600 text-white border-0 px-3 py-1 text-sm">
                                    Mystery: {mysteryLabels[aiResult.mysteryLevel]}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/30 text-purple-300 text-sm font-medium">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  AI Generated
                                </div>
                              </div>

                              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-2 tracking-tight text-card-foreground">{aiResult.name}</h2>
                              <p className="text-xl text-card-foreground/60 italic font-serif mb-6">{aiResult.genus}</p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl">
                                {[
                                  { icon: Clock, label: "Era", value: aiResult.era },
                                  { icon: Utensils, label: "Diet", value: aiResult.diet },
                                  { icon: Ruler, label: "Size", value: aiResult.size },
                                  { icon: MapPin, label: "Habitat", value: aiResult.habitat },
                                ].map(({ icon: Icon, label, value }) => (
                                  <div key={label} className="flex flex-col gap-1">
                                    <span className="text-xs text-card-foreground/50 uppercase tracking-wider font-semibold flex items-center gap-1">
                                      <Icon className="w-3 h-3" /> {label}
                                    </span>
                                    <span className="font-medium text-card-foreground">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <Separator className="my-6 opacity-20" />

                          <div className="grid md:grid-cols-3 gap-10">
                            <div className="md:col-span-2 space-y-6">
                              <section>
                                <h3 className="text-xl font-serif font-bold mb-3 text-card-foreground">Overview</h3>
                                <p className="text-card-foreground/75 leading-relaxed">{aiResult.description}</p>
                              </section>

                              {aiResult.funFacts.length > 0 && (
                                <section>
                                  <h3 className="text-xl font-serif font-bold mb-3 text-card-foreground">Field Notes</h3>
                                  <ul className="space-y-3">
                                    {aiResult.funFacts.map((fact, i) => (
                                      <li key={i} className="flex items-start gap-3">
                                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-card-foreground/80 font-bold text-sm">{i + 1}</span>
                                        <span className="text-card-foreground/75 leading-relaxed">{fact}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </section>
                              )}
                            </div>

                            <div>
                              {aiResult.family.length > 0 && (
                                <section>
                                  <h3 className="text-xl font-serif font-bold mb-3 text-card-foreground">Living Relatives</h3>
                                  <div className="space-y-2">
                                    {aiResult.family.map((rel, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <span>{rel.living ? "🌿" : "🦴"}</span>
                                        <span className="text-sm text-card-foreground/70">{rel.name}</span>
                                      </div>
                                    ))}
                                  </div>
                                </section>
                              )}
                            </div>
                          </div>

                          <Separator className="my-6 opacity-20" />

                          {/* Auto-saved confirmation */}
                          <div className="flex items-center justify-between bg-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                              <div>
                                <p className="font-semibold font-serif text-card-foreground">Saved to your collection</p>
                                <p className="text-sm text-card-foreground/60 mt-0.5">
                                  This creature is now permanently in your database.
                                </p>
                              </div>
                            </div>
                            {savedId && (
                              <a
                                href={`/creature/${savedId}`}
                                className="shrink-0 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-card-foreground px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
                              >
                                View Profile →
                              </a>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed"
            >
              <h3 className="text-2xl font-serif text-foreground/60 mb-2">No specimens found</h3>
              <p className="text-foreground/50">Try adjusting your search filters.</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Layout>
  );
}
