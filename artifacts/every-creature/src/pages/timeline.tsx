import { scientificLabel } from "@/data/creatures";
import { useRef } from "react";
import { Layout } from "@/components/layout";
import { categoryEmojis, categoryColors } from "@/data/creatures";
import { useCreatures } from "@/hooks/useCreatures";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { type Creature } from "@/data/creatures";

/* ─── Geological periods (oldest → youngest) ─────────────────────────────── */
const PERIODS = [
  {
    name: "Ediacaran",      eon: "Proterozoic", start: 635,   end: 538.8,
    bg: "bg-violet-950",   stripe: "bg-violet-800",  label: "text-violet-200",
    accent: "#5b21b6",     hex: "#4c1d95",
  },
  {
    name: "Cambrian",       eon: "Paleozoic",   start: 538.8, end: 485.4,
    bg: "bg-teal-950",     stripe: "bg-teal-700",    label: "text-teal-200",
    accent: "#0f766e",     hex: "#134e4a",
  },
  {
    name: "Ordovician",     eon: "Paleozoic",   start: 485.4, end: 443.8,
    bg: "bg-sky-950",      stripe: "bg-sky-700",     label: "text-sky-200",
    accent: "#0369a1",     hex: "#0c4a6e",
  },
  {
    name: "Silurian",       eon: "Paleozoic",   start: 443.8, end: 419.2,
    bg: "bg-lime-950",     stripe: "bg-lime-700",    label: "text-lime-200",
    accent: "#4d7c0f",     hex: "#365314",
  },
  {
    name: "Devonian",       eon: "Paleozoic",   start: 419.2, end: 358.9,
    bg: "bg-orange-950",   stripe: "bg-orange-700",  label: "text-orange-200",
    accent: "#c2410c",     hex: "#7c2d12",
  },
  {
    name: "Carboniferous",  eon: "Paleozoic",   start: 358.9, end: 298.9,
    bg: "bg-green-950",    stripe: "bg-green-700",   label: "text-green-200",
    accent: "#15803d",     hex: "#14532d",
  },
  {
    name: "Permian",        eon: "Paleozoic",   start: 298.9, end: 251.9,
    bg: "bg-red-950",      stripe: "bg-red-700",     label: "text-red-200",
    accent: "#b91c1c",     hex: "#7f1d1d",
  },
  {
    name: "Triassic",       eon: "Mesozoic",    start: 251.9, end: 201.4,
    bg: "bg-rose-950",     stripe: "bg-rose-600",    label: "text-rose-200",
    accent: "#e11d48",     hex: "#881337",
  },
  {
    name: "Jurassic",       eon: "Mesozoic",    start: 201.4, end: 145,
    bg: "bg-cyan-950",     stripe: "bg-cyan-600",    label: "text-cyan-200",
    accent: "#0891b2",     hex: "#164e63",
  },
  {
    name: "Cretaceous",     eon: "Mesozoic",    start: 145,   end: 66,
    bg: "bg-emerald-950",  stripe: "bg-emerald-600", label: "text-emerald-200",
    accent: "#059669",     hex: "#064e3b",
  },
  {
    name: "Paleogene",      eon: "Cenozoic",    start: 66,    end: 23.03,
    bg: "bg-yellow-950",   stripe: "bg-yellow-600",  label: "text-yellow-200",
    accent: "#ca8a04",     hex: "#713f12",
  },
  {
    name: "Neogene",        eon: "Cenozoic",    start: 23.03, end: 2.58,
    bg: "bg-amber-950",    stripe: "bg-amber-500",   label: "text-amber-200",
    accent: "#d97706",     hex: "#78350f",
  },
  {
    name: "Quaternary",     eon: "Cenozoic",    start: 2.58,  end: 0,
    bg: "bg-slate-800",    stripe: "bg-slate-500",   label: "text-slate-200",
    accent: "#64748b",     hex: "#334155",
  },
] as const;

type Period = (typeof PERIODS)[number];

/* ─── Parse mya strings ───────────────────────────────────────────────────
 *  Handles:  "68-66 Ma"  |  "112 Ma"  |  "Extinct 1681"  |  "Present"
 *  Returns Ma-ago values (larger = further in the past).
 *  CE years and "Present" → mapped to ~0 Ma (Quaternary).
 * ──────────────────────────────────────────────────────────────────────── */
function parseMya(mya: string): { start: number; end: number } {
  const lower = mya.toLowerCase().trim();

  // "Present" / "present" / "Extant" → living today
  if (lower === "present" || lower === "extant" || lower === "ongoing") {
    return { start: 0.005, end: 0 };
  }

  // "Extinct YYYY" → a CE year, treat as essentially 0 Ma ago
  if (lower.startsWith("extinct")) {
    return { start: 0.005, end: 0 };
  }

  // Extract all decimal numbers
  const nums = (mya.match(/[\d.]+/g) ?? []).map(Number).filter((n) => !isNaN(n));
  if (nums.length === 0) return { start: 0.005, end: 0 };

  const maxNum = Math.max(...nums);

  // If the largest number looks like a CE year (> 1000), it's recent
  if (maxNum > 700) return { start: 0.005, end: 0 };

  return { start: maxNum, end: Math.min(...nums) };
}

function primaryPeriod(creature: Creature): Period | undefined {
  const { start } = parseMya(creature.mya);
  // Find the period whose range contains the creature's oldest point
  for (const p of PERIODS) {
    if (start <= p.start && start >= p.end) return p;
  }
  // start > any period max (shouldn't happen after CE fix) → Quaternary
  if (start < PERIODS[PERIODS.length - 1].start) return PERIODS[PERIODS.length - 1];
  // start > Ediacaran start → oldest period
  return PERIODS[0];
}

/* ─── Creature chip ──────────────────────────────────────────────────────── */
function CreatureChip({
  creature,
  accent,
  index,
}: {
  creature: Creature;
  accent: string;
  index: number;
}) {
  return (
    <motion.a
      href={`/creature/${creature.id}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
        {categoryEmojis[creature.category] ?? "🦴"}
      </span>
      <div className="min-w-0">
        <p className="font-serif font-bold text-white leading-tight truncate">
          {creature.name}
        </p>
        <p className="text-xs text-white/50 italic truncate">{scientificLabel(creature)}</p>
      </div>
      <Badge
        variant="outline"
        className={`shrink-0 ml-auto text-[10px] border-0 ${categoryColors[creature.category]}`}
      >
        {creature.category}
      </Badge>
    </motion.a>
  );
}

/* ─── Period section ─────────────────────────────────────────────────────── */
function PeriodSection({
  period,
  creatures,
}: {
  period: Period;
  creatures: Creature[];
}) {
  const spanMa = period.start - period.end;
  const label =
    spanMa >= 100 ? `${Math.round(period.start)}–${Math.round(period.end)} Ma`
    : spanMa >= 1   ? `${period.start.toFixed(0)}–${period.end.toFixed(2).replace(/\.?0+$/, "")} Ma`
    :                 `${period.start}–${period.end} Ma`;

  return (
    <section
      id={`period-${period.name.toLowerCase()}`}
      className={`${period.bg} rounded-2xl overflow-hidden mb-4`}
    >
      <div className="flex">
        {/* Coloured stripe + rotated label */}
        <div
          className={`${period.stripe} w-12 shrink-0 flex items-center justify-center relative`}
          style={{ minHeight: "120px" }}
        >
          <span
            className="text-white/80 text-xs font-bold tracking-widest uppercase select-none"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              whiteSpace: "nowrap",
            }}
          >
            {period.name}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {/* Header row */}
          <div className="flex flex-wrap items-baseline gap-3 mb-5">
            <h2 className={`text-2xl font-serif font-bold ${period.label}`}>
              {period.name}
            </h2>
            <span className="text-white/40 text-sm font-mono">{label}</span>
            <Badge
              variant="outline"
              className="border-white/20 text-white/50 text-xs ml-auto"
            >
              {period.eon}
            </Badge>
            {creatures.length > 0 && (
              <span className="text-white/40 text-xs">
                {creatures.length} specimen{creatures.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Creature chips */}
          {creatures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {creatures.map((c, i) => (
                <CreatureChip
                  key={c.id}
                  creature={c}
                  accent={period.accent}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <p className="text-white/25 text-sm italic">
              No specimens in our collection from this period.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function Timeline() {
  const { creatures } = useCreatures();
  const navRef = useRef<HTMLDivElement>(null);

  // Group creatures by their primary period
  const grouped = new Map<string, Creature[]>(PERIODS.map((p) => [p.name, []]));
  for (const c of creatures) {
    const p = primaryPeriod(c);
    if (p) grouped.get(p.name)?.push(c);
  }

  // Total count across all periods for the header stat
  const placed = [...grouped.values()].reduce((s, arr) => s + arr.length, 0);

  const scrollTo = (periodName: string) => {
    document.getElementById(`period-${periodName.toLowerCase()}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="mb-10 pt-2">
        <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-2">
              Through Deep Time
            </h1>
            <p className="text-foreground/60 text-lg max-w-xl">
              {placed} specimens plotted across {(635).toLocaleString()} million years of
              Earth's history — from the Ediacaran to the present day.
            </p>
          </div>
        </div>

        {/* Period navigator strip */}
        <div
          ref={navRef}
          className="flex flex-wrap gap-1.5 p-4 rounded-2xl border bg-card/50 backdrop-blur"
        >
          {PERIODS.map((p) => {
            const count = grouped.get(p.name)?.length ?? 0;
            return (
              <button
                key={p.name}
                onClick={() => scrollTo(p.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 hover:shadow-md text-white"
                style={{ backgroundColor: p.accent }}
                title={`${p.name} — ${count} specimen${count !== 1 ? "s" : ""}`}
              >
                <span>{p.name}</span>
                {count > 0 && (
                  <span className="bg-black/30 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Eon dividers + period sections */}
      {(["Proterozoic", "Paleozoic", "Mesozoic", "Cenozoic"] as const).map((eon) => {
        const eonPeriods = PERIODS.filter((p) => p.eon === eon);
        const eonCount = eonPeriods.reduce(
          (s, p) => s + (grouped.get(p.name)?.length ?? 0),
          0
        );

        const eonLabels: Record<string, string> = {
          Proterozoic: "Proterozoic Eon",
          Paleozoic:   "Paleozoic Era",
          Mesozoic:    "Mesozoic Era — Age of Reptiles",
          Cenozoic:    "Cenozoic Era — Age of Mammals",
        };

        return (
          <div key={eon} className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-sm font-semibold text-foreground/40 uppercase tracking-widest whitespace-nowrap">
                {eonLabels[eon]}
              </span>
              {eonCount > 0 && (
                <span className="text-xs text-foreground/30">{eonCount} specimens</span>
              )}
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {eonPeriods.map((period) => (
              <PeriodSection
                key={period.name}
                period={period}
                creatures={grouped.get(period.name) ?? []}
              />
            ))}
          </div>
        );
      })}

      {/* Footer scale */}
      <div data-testid="timeline-scale" className="mt-8 p-6 rounded-2xl bg-card text-card-foreground border text-center">
        <p className="text-3xl font-serif font-bold mb-1">
          {(635).toLocaleString()} million years
        </p>
        <p className="text-[#d6cec1] text-sm">
          The span of animal life on Earth — compressed into a single scroll.
        </p>
      </div>
    </Layout>
  );
}
