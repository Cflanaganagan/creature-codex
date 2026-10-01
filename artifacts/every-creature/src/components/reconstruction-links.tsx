import { ExternalLink, Image } from "lucide-react";
import type { Creature } from "@/data/creatures";

// Editorial links, not AI-invented URLs. Images stay on their original publisher's site.
const museumPages: Record<string, string> = {
  "dodo": "https://www.nhm.ac.uk/discover/the-dodo-bird-the-real-facts-about-this-icon-of-extinction.html",
  "tyrannosaurus-rex": "https://www.nhm.ac.uk/discover/dino-directory/tyrannosaurus.html",
  "smilodon": "https://www.nhm.ac.uk/discover/news/2025/december/sabre-toothed-tiger-sense-smell-reconstructed-skull-scans.html",
};
export function ReconstructionLinks({creature, compact = false}: {creature: Pick<Creature, "id" | "name" | "scientificName">; compact?: boolean}) {
  const query = `${creature.scientificName || creature.name} reconstruction`;
  const search = `https://commons.wikimedia.org/wiki/Special:MediaSearch?type=image&search=${encodeURIComponent(query)}`;
  const museum = museumPages[creature.id];
  const linkClass = "inline-flex items-center gap-2 text-sm underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";
  if (compact) return <a href={museum || search} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label={`Explore reconstructions of ${creature.name} (opens in a new tab)`}><Image className="h-3.5 w-3.5" />Reconstructions<ExternalLink className="h-3 w-3" /></a>;
  return <section className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3" aria-label="Reconstruction images">
    <div><h2 className="font-serif text-base font-bold">Beyond the bones</h2><p className="text-xs opacity-65">Explore artistic reconstructions of life in the past.</p></div>
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {museum && <a href={museum} target="_blank" rel="noopener noreferrer" className={linkClass}>Museum illustrations<ExternalLink className="h-3.5 w-3.5" /></a>}
      <a href={search} target="_blank" rel="noopener noreferrer" className={linkClass}>Reconstruction images<ExternalLink className="h-3.5 w-3.5" /></a>
    </div>
    <p className="w-full text-xs opacity-60">Reconstructions are interpretations; details may be uncertain. Images open on {museum ? "the Natural History Museum or " : ""}Wikimedia Commons.</p>
  </section>;
}
