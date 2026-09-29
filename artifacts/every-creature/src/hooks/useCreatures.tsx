import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { creatures as defaultCreatures, isExtinctCreature, type Creature } from "@/data/creatures";

const STORAGE_KEY = "every-creature-db";
const SHARED_CACHE_KEY = "woolly-extinct-shared-cache-v1";

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

type CollectionStatus = "loading" | "shared" | "preview" | "offline";
type CreaturesContextValue = {
  creatures: Creature[];
  isCustom: boolean;
  collectionStatus: CollectionStatus;
  sharedCount: number;
  refreshCollection: () => Promise<void>;
  acceptDiscoveredCreature: (creature: Creature) => void;
  importCreatures: (incoming: Creature[], mode: ImportMode) => void;
  resetToDefaults: () => void;
};
const CreaturesContext = createContext<CreaturesContextValue | null>(null);
function readSharedCache(): Creature[] {
  try { const cached = JSON.parse(localStorage.getItem(SHARED_CACHE_KEY) || "null"); if (Array.isArray(cached) && cached.length) return cached.filter(isExtinctCreature); } catch { /* optional cache */ }
  return defaultCreatures;
}

export function CreaturesProvider({ children }: { children: ReactNode }) {
  const [shared, setShared] = useState<Creature[]>(readSharedCache);
  // Preserve old browser discoveries and imports without publishing unvalidated JSON.
  const [personal, setPersonal] = useState<Creature[]>(() => loadFromStorage() || []);
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus>("loading");
  const inFlight = useRef(false);
  const revision = useRef(0);
  const refreshCollection = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const startedAt = revision.current;
    try {
      const response = await fetch("/api/creatures", { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("Collection unavailable");
      const data = await response.json();
      if (!Array.isArray(data.creatures) || !["shared", "preview"].includes(data.mode)) throw new Error("Invalid collection");
      // A discovery that completes during this fetch must not be replaced by an older snapshot.
      if (revision.current === startedAt) {
        setShared(data.creatures.filter(isExtinctCreature));
        if (data.mode === "shared") try { localStorage.setItem(SHARED_CACHE_KEY, JSON.stringify(data.creatures.filter(isExtinctCreature))); } catch { /* optional cache */ }
      }
      setCollectionStatus(data.mode);
    } catch { setCollectionStatus("offline"); }
    finally { inFlight.current = false; }
  }, []);
  useEffect(() => {
    void refreshCollection();
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void refreshCollection(); };
    const interval = window.setInterval(refreshWhenVisible, 15000);
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("online", refreshWhenVisible);
    return () => { clearInterval(interval); window.removeEventListener("focus", refreshWhenVisible); window.removeEventListener("online", refreshWhenVisible); };
  }, [refreshCollection]);
  const creatures = useMemo(() => {
    const ids = new Set(shared.map(c=>c.id));
    return [...shared, ...personal.filter(c=>!ids.has(c.id))].filter(isExtinctCreature);
  }, [shared, personal]);
  const acceptDiscoveredCreature = useCallback((creature: Creature) => {
    if (!isExtinctCreature(creature)) return;
    revision.current++;
    setShared(current => {
      const next = current.some(c=>c.id===creature.id) ? current : [...current, creature];
      try { localStorage.setItem(SHARED_CACHE_KEY, JSON.stringify(next)); } catch { /* optional cache */ }
      return next;
    });
    setCollectionStatus("shared");
    void refreshCollection();
  }, [refreshCollection]);
  const importCreatures = useCallback((incoming: Creature[], mode: ImportMode) => {
    if (incoming.some(c => !isExtinctCreature(c))) throw new Error("Only confirmed extinct creatures can be imported.");
    setPersonal(current => {
      const existingIds = new Set(current.map(c=>c.id));
      const next = mode === "replace" ? incoming : [...current,...incoming.filter(c=>!existingIds.has(c.id))];
      saveToStorage(next); return next;
    });
  }, []);
  const resetToDefaults = useCallback(() => { localStorage.removeItem(STORAGE_KEY); setPersonal([]); }, []);
  return <CreaturesContext.Provider value={{creatures,isCustom:personal.length>0,collectionStatus,sharedCount:shared.length,refreshCollection,acceptDiscoveredCreature,importCreatures,resetToDefaults}}>{children}</CreaturesContext.Provider>;
}

export function useCreatures() {
  const ctx = useContext(CreaturesContext);
  if (!ctx) throw new Error("useCreatures must be used inside CreaturesProvider");
  return ctx;
}
