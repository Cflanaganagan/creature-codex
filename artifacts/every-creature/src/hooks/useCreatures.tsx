import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { creatures as defaultCreatures, type Creature } from "@/data/creatures";

const STORAGE_KEY = "every-creature-db";

const CATEGORY_MIGRATION: Record<string, string> = {
  "Theropods":               "Reptiles",
  "Sauropods":               "Reptiles",
  "Ceratopsians":            "Reptiles",
  "Armoured Dinosaurs":      "Reptiles",
  "Pterosaurs":              "Reptiles",
  "Synapsids":               "Reptiles",
  "Marine Reptiles":         "Aquatic",
  "Prehistoric Fish":        "Aquatic",
  "Giant Prehistoric Insects":"Invertebrates",
  "Ice Age Megafauna":       "Mammals",
  "Prehistoric Mammals":     "Mammals",
  "Living Animals":          "Mammals",
  "Recently Extinct":        "Mammals",
};

const AQUATIC_IDS = new Set([
  "mosasaurus","elasmosaurus","ichthyosaurus","plesiosaurus","kronosaurus",
  "liopleurodon","megalodon","dunkleosteus","helicoprion","leedsichthys",
  "coelacanth","basilosaurus","stellers-sea-cow","orca","sperm-whale",
  "great-white-shark","green-anaconda","mantis-shrimp","pistol-shrimp",
  "archerfish","mimic-octopus",
]);
const BIRDS_IDS = new Set([
  "terror-bird","dodo","passenger-pigeon","great-auk","peregrine-falcon",
]);
const REPTILE_IDS = new Set([
  "sarcosuchus","deinosuchus","titanoboa","saltwater-crocodile","komodo-dragon",
]);
const INVERTEBRATE_IDS = new Set([
  "meganeura","arthropleura","pulmonoscorpius","jaekelopterus","tardigrade",
  "mantis","cambrian-anomalocaris",
]);

function migrateCreature(c: Creature): Creature {
  const oldCat = c.category;
  if (AQUATIC_IDS.has(c.id)) return { ...c, category: "Aquatic" };
  if (BIRDS_IDS.has(c.id)) return { ...c, category: "Birds" };
  if (REPTILE_IDS.has(c.id)) return { ...c, category: "Reptiles" };
  if (INVERTEBRATE_IDS.has(c.id)) return { ...c, category: "Invertebrates" };
  const mapped = CATEGORY_MIGRATION[oldCat];
  if (mapped) return { ...c, category: mapped };
  return c;
}

function loadFromStorage(): Creature[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const migrated = (parsed as Creature[]).map(migrateCreature);
      const needsSave = migrated.some((c, i) => c.category !== (parsed as Creature[])[i].category);
      if (needsSave) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch { /* ignore */ }
      }
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(data: Creature[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — fail silently
  }
}

type ImportMode = "replace" | "merge";

type CreaturesContextValue = {
  creatures: Creature[];
  isCustom: boolean;
  importCreatures: (incoming: Creature[], mode: ImportMode) => void;
  resetToDefaults: () => void;
};

const CreaturesContext = createContext<CreaturesContextValue | null>(null);

export function CreaturesProvider({ children }: { children: ReactNode }) {
  const [creatures, setCreatures] = useState<Creature[]>(() => {
    return loadFromStorage() ?? defaultCreatures;
  });

  const [isCustom, setIsCustom] = useState<boolean>(() => {
    return loadFromStorage() !== null;
  });

  const importCreatures = useCallback((incoming: Creature[], mode: ImportMode) => {
    let next: Creature[];
    if (mode === "replace") {
      next = incoming;
    } else {
      const existingIds = new Set(creatures.map((c) => c.id));
      const newOnes = incoming.filter((c) => !existingIds.has(c.id));
      next = [...creatures, ...newOnes];
    }
    saveToStorage(next);
    setCreatures(next);
    setIsCustom(true);
  }, [creatures]);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCreatures(defaultCreatures);
    setIsCustom(false);
  }, []);

  return (
    <CreaturesContext.Provider value={{ creatures, isCustom, importCreatures, resetToDefaults }}>
      {children}
    </CreaturesContext.Provider>
  );
}

export function useCreatures() {
  const ctx = useContext(CreaturesContext);
  if (!ctx) throw new Error("useCreatures must be used inside CreaturesProvider");
  return ctx;
}
