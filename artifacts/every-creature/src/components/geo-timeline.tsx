/* Geological Era Timeline — replaces the "When it lived" bar */

interface Segment {
  label: string;
  short: string;
  start: number; /* Ma ago — larger = older */
  end: number;
  bg: string;
  text: string;
}

const SEGMENTS: Segment[] = [
  { label: "Precambrian",       short: "Pre",  start: 4500,  end: 541,  bg: "#4a3828", text: "#d4b896" },
  { label: "Camb–Devon",        short: "C–D",  start: 541,   end: 359,  bg: "#1a6b5a", text: "#8fe8d0" },
  { label: "Carb–Perm",         short: "C–P",  start: 359,   end: 252,  bg: "#1e5c2a", text: "#90d8a0" },
  { label: "Triassic",          short: "Tri",  start: 252,   end: 201,  bg: "#702040", text: "#f0a0c0" },
  { label: "Jurassic",          short: "Jur",  start: 201,   end: 145,  bg: "#1a4a70", text: "#90c8f0" },
  { label: "Cretaceous",        short: "Cre",  start: 145,   end: 66,   bg: "#1a5c3a", text: "#8fe0b8" },
  { label: "Palg–Neog",         short: "P–N",  start: 66,    end: 2.58, bg: "#7a5010", text: "#f0d070" },
  { label: "Quaternary",        short: "Quat", start: 2.58,  end: 0,    bg: "#405060", text: "#b8ccd8" },
];

const TOTAL_SEGS = SEGMENTS.length;

/* Parse mya string → { maStart, maEnd } in millions of years ago */
function parseMya(mya: string): { maStart: number; maEnd: number } | null {
  const lower = mya.toLowerCase().trim();
  if (lower === "present" || lower === "extant") return { maStart: 0, maEnd: 0 };
  if (lower.startsWith("extinct")) return { maStart: 0.002, maEnd: 0 };

  const nums = (mya.match(/[\d.]+/g) ?? []).map(Number).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  const max = Math.max(...nums);
  if (max > 700) return { maStart: 0.002, maEnd: 0 };
  return { maStart: max, maEnd: Math.min(...nums) };
}

/* Position 0–1 along the bar for a given Ma value (older → left, present → right) */
function markerPos(ma: number): number {
  for (let i = 0; i < SEGMENTS.length; i++) {
    const seg = SEGMENTS[i];
    if (ma <= seg.start && ma >= seg.end) {
      const within = (seg.start - ma) / (seg.start - seg.end);
      return (i + within) / TOTAL_SEGS;
    }
  }
  return ma > SEGMENTS[0].start ? 0 : 1;
}

/* Human-readable mya string */
function myaToText(mya: string): string {
  const lower = mya.toLowerCase().trim();
  if (lower === "present" || lower === "extant") return "Living today";
  if (lower.startsWith("extinct")) {
    const year = mya.replace(/extinct\s*/i, "").trim();
    return `Last recorded ${year} CE`;
  }
  const nums = (mya.match(/[\d.]+/g) ?? []).map(Number).filter(Boolean);
  if (nums.length === 0) return mya;
  const max = Math.max(...nums);
  if (max > 700) return `Last recorded ${Math.round(max)} CE`;

  const a = Math.max(...nums);
  const b = Math.min(...nums);

  const fmtMa = (n: number): { value: string; unit: string } => {
    if (n >= 1000) return { value: `${(n / 1000).toFixed(1).replace(/\.0$/, "")} billion`, unit: "years ago" };
    if (n >= 1) return { value: n.toLocaleString(), unit: "million years ago" };
    const years = Math.round(n * 1_000_000);
    if (years >= 1_000_000) return { value: (years / 1_000_000).toFixed(1).replace(/\.0$/, ""), unit: "million years ago" };
    return { value: years.toLocaleString(), unit: "years ago" };
  };

  if (a === b) {
    const { value, unit } = fmtMa(a);
    return `${value} ${unit}`;
  }
  const lo = fmtMa(b);
  const hi = fmtMa(a);
  // Same unit — collapse it
  if (lo.unit === hi.unit) return `${lo.value} – ${hi.value} ${hi.unit}`;
  return `${lo.value} ${lo.unit} – ${hi.value} ${hi.unit}`;
}

export function GeologicalTimeline({ mya }: { mya: string }) {
  const parsed = parseMya(mya);
  const midMa = parsed ? (parsed.maStart + parsed.maEnd) / 2 : 0;
  const pos = markerPos(midMa);
  const text = myaToText(mya);

  return (
    <div className="space-y-3">
      {/* Segmented bar */}
      <div className="relative">
        <div className="flex h-8 rounded-lg overflow-hidden gap-px">
          {SEGMENTS.map((seg, i) => (
            <div
              key={seg.label}
              className="flex-1 flex items-center justify-center relative group"
              style={{ backgroundColor: seg.bg }}
              title={`${seg.label} (${seg.start.toLocaleString()}–${seg.end} Ma)`}
            >
              <span
                className="text-[9px] font-bold tracking-wide uppercase opacity-70 select-none"
                style={{ color: seg.text, writingMode: i < 2 ? "horizontal-tb" : "horizontal-tb" }}
              >
                {seg.short}
              </span>
            </div>
          ))}
        </div>

        {/* Marker dot */}
        {parsed && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10"
            style={{ left: `${pos * 100}%` }}
          >
            {/* Glow */}
            <div className="w-5 h-5 rounded-full bg-white/20 absolute -inset-1 animate-pulse" />
            {/* Dot */}
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] border-2 border-white/30" />
          </div>
        )}
      </div>

      {/* Segment labels */}
      <div className="flex text-[10px] text-muted-foreground/50 font-mono">
        {SEGMENTS.map((seg) => (
          <div key={seg.label} className="flex-1 text-center truncate px-0.5">
            {seg.short}
          </div>
        ))}
      </div>

      {/* Era edge labels */}
      <div className="flex justify-between text-[10px] text-card-foreground/30 font-mono">
        <span>4.5 Ga</span>
        <span>Present</span>
      </div>

      {/* Plain-English date */}
      <p className="text-sm text-card-foreground/70 font-serif italic text-center pt-1">
        {text}
      </p>
    </div>
  );
}
