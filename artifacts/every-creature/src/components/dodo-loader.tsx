import { useEffect, useState } from "react";
import { Bone } from "lucide-react";

const FLAVOUR = [
  "Consulting the fossil record...",
  "Excavating the archives...",
  "Comparing field notes...",
  "Asking the palaeontologists...",
  "Cataloguing the specimen...",
];

export function DodoLoader() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPhraseIndex((i) => (i + 1) % FLAVOUR.length), 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center select-none py-8" role="status" aria-live="polite">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-primary/15" />
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-primary/70 border-r-primary/30 animate-spin" />
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center shadow-sm">
          <Bone className="w-6 h-6 text-primary/75 -rotate-12" />
        </div>
      </div>
      <p className="text-sm font-serif italic text-muted-foreground text-center mt-4 min-h-5 transition-opacity duration-300">
        {FLAVOUR[phraseIndex]}
      </p>
    </div>
  );
}
