import { Layout } from "@/components/layout";
import { categoryEmojis, categoryColors, isInExhibit, mysterySelection } from "@/data/creatures";
import { useCreatures } from "@/hooks/useCreatures";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Mystery() {
  const { creatures } = useCreatures();
  const mysteryCreatures = creatures
    .filter((c) => isInExhibit(c,"Mystery Creatures"))
    .sort((a, b) => b.mysteryLevel - a.mysteryLevel);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto text-center mb-16 pt-8">
        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6 text-purple-900 dark:text-purple-300">Mystery Creatures</h1>
        <p className="text-xl text-muted-foreground font-light leading-relaxed">
          The fossil record is fragmented. Sometimes we find a single tooth, a solitary footprint, or an impression in stone that defies all known categories. These are the enigmas—specimens that remind us how much we still don't know about the history of life on Earth.
        </p>
      </div>

      {mysteryCreatures.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <h3 className="text-2xl font-serif text-muted-foreground mb-2">No mystery creatures yet</h3>
          <p className="text-muted-foreground">Explore the collection while new mysteries await discovery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mysteryCreatures.map((creature, i) => (
            <motion.a 
              href={`/creature/${creature.id}`}
              key={creature.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative block bg-card text-card-foreground rounded-2xl overflow-hidden border border-purple-900/30 hover:border-purple-500/50 hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.3)] hover:-translate-y-1 transition-all duration-500"
              data-testid={`card-mystery-${creature.id}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-10 pointer-events-none mix-blend-multiply" />
              
              <div className="relative z-20 p-8 h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-6xl opacity-80 group-hover:opacity-100 transition-opacity blur-[1px] group-hover:blur-none">{categoryEmojis[creature.category]}</span>
                  <Badge className={`${creature.mysteryLevel === 3 ? 'bg-purple-900' : 'bg-amber-700'} text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider`}>
                    Museum Mystery
                  </Badge>
                </div>
                
                <div className="mt-auto">
                  <h3 className="text-3xl font-serif font-bold mb-2 text-white">{creature.name}</h3>
                  <p className="italic text-purple-200/70 mb-4 font-serif">{creature.genus}</p>
                  <p className="text-sm text-gray-300 line-clamp-3 mb-6">
                    {creature.description}
                  </p>
                  {mysterySelection(creature) && <p className="text-sm text-purple-100/80 mb-5">{mysterySelection(creature)!.reason}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-300/50 uppercase tracking-widest font-semibold">{creature.era}</span>
                    <span className="text-purple-400 group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </Layout>
  );
}
