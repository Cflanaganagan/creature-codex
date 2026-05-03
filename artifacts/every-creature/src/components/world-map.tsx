/**
 * World map using D3 + TopoJSON with real continent/country shapes.
 * Country geographic data © Natural Earth (world-atlas 110m).
 */
import { useEffect, useRef, useState } from "react";

interface WorldMapProps {
  regions?: string[];
  habitat?: string;
  glowColor?: string;
  mya?: string;
}

/* ─── World atlas data cache ─────────────────────────────────── */
let _worldCache: unknown = null;
let _worldPromise: Promise<unknown> | null = null;
function loadWorld(): Promise<unknown> {
  if (_worldCache) return Promise.resolve(_worldCache);
  if (_worldPromise) return _worldPromise;
  _worldPromise = fetch(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  )
    .then((r) => r.json())
    .then((d) => { _worldCache = d; return d; });
  return _worldPromise;
}

/* ─── ISO 3166-1 numeric → continent ────────────────────────── */
const C: Record<number, string> = {
  // Africa
  12:"Africa",24:"Africa",204:"Africa",72:"Africa",854:"Africa",
  108:"Africa",120:"Africa",140:"Africa",148:"Africa",174:"Africa",
  175:"Africa",178:"Africa",180:"Africa",384:"Africa",226:"Africa",
  262:"Africa",818:"Africa",232:"Africa",231:"Africa",266:"Africa",
  270:"Africa",288:"Africa",324:"Africa",624:"Africa",404:"Africa",
  426:"Africa",430:"Africa",434:"Africa",450:"Africa",454:"Africa",
  466:"Africa",478:"Africa",480:"Africa",504:"Africa",508:"Africa",
  516:"Africa",562:"Africa",566:"Africa",646:"Africa",678:"Africa",
  686:"Africa",694:"Africa",706:"Africa",710:"Africa",728:"Africa",
  729:"Africa",748:"Africa",834:"Africa",768:"Africa",788:"Africa",
  800:"Africa",716:"Africa",132:"Africa",638:"Africa",732:"Africa",
  // Asia
  4:"Asia",50:"Asia",64:"Asia",96:"Asia",116:"Asia",156:"Asia",
  268:"Asia",356:"Asia",360:"Asia",364:"Asia",368:"Asia",
  376:"Asia",392:"Asia",400:"Asia",398:"Asia",414:"Asia",
  417:"Asia",418:"Asia",422:"Asia",458:"Asia",462:"Asia",
  496:"Asia",104:"Asia",524:"Asia",408:"Asia",512:"Asia",
  586:"Asia",275:"Asia",608:"Asia",634:"Asia",682:"Asia",
  702:"Asia",410:"Asia",144:"Asia",760:"Asia",158:"Asia",
  762:"Asia",764:"Asia",626:"Asia",795:"Asia",784:"Asia",
  860:"Asia",704:"Asia",887:"Asia",51:"Asia",31:"Asia",48:"Asia",
  643:"Asia", // Russia (by territory)
  // Europe
  8:"Europe",20:"Europe",40:"Europe",112:"Europe",56:"Europe",
  70:"Europe",100:"Europe",191:"Europe",196:"Europe",203:"Europe",
  208:"Europe",233:"Europe",246:"Europe",250:"Europe",276:"Europe",
  300:"Europe",348:"Europe",352:"Europe",372:"Europe",380:"Europe",
  428:"Europe",438:"Europe",440:"Europe",442:"Europe",807:"Europe",
  470:"Europe",498:"Europe",492:"Europe",499:"Europe",528:"Europe",
  578:"Europe",616:"Europe",620:"Europe",642:"Europe",674:"Europe",
  688:"Europe",703:"Europe",705:"Europe",724:"Europe",752:"Europe",
  756:"Europe",804:"Europe",826:"Europe",336:"Europe",
  // North America
  28:"North America",44:"North America",52:"North America",
  84:"North America",124:"North America",188:"North America",
  192:"North America",212:"North America",214:"North America",
  222:"North America",308:"North America",312:"North America",
  316:"North America",320:"North America",332:"North America",
  340:"North America",388:"North America",474:"North America",
  484:"North America",500:"North America",558:"North America",
  591:"North America",630:"North America",659:"North America",
  662:"North America",670:"North America",780:"North America",
  796:"North America",840:"North America",850:"North America",
  60:"North America",136:"North America",534:"North America",
  535:"North America",
  // South America
  32:"South America",68:"South America",76:"South America",
  152:"South America",170:"South America",218:"South America",
  238:"South America",254:"South America",328:"South America",
  600:"South America",604:"South America",740:"South America",
  858:"South America",862:"South America",
  // Australia / Oceania
  36:"Australia",184:"Australia",242:"Australia",258:"Australia",
  296:"Australia",584:"Australia",583:"Australia",520:"Australia",
  554:"Australia",570:"Australia",598:"Australia",585:"Australia",
  882:"Australia",90:"Australia",776:"Australia",798:"Australia",
  548:"Australia",540:"Australia",574:"Australia",166:"Australia",
  // Antarctica
  10:"Antarctica",
};

/* ─── Region alias → canonical continent name ─────────────────── */
const ALIASES: Record<string, string> = {
  "north america":"North America","central america":"North America",
  "caribbean":"North America","greenland":"North America",
  "canada":"North America","mexico":"North America","united states":"North America",
  "south america":"South America","patagonia":"South America",
  "argentina":"South America","brazil":"South America",
  "andes":"South America","amazon":"South America",
  "europe":"Europe","england":"Europe","britain":"Europe",
  "germany":"Europe","france":"Europe","spain":"Europe",
  "italy":"Europe","scandinavia":"Europe","eastern europe":"Europe",
  "russia":"Asia","siberia":"Asia",
  "africa":"Africa","egypt":"Africa","sahara":"Africa",
  "morocco":"Africa","tanzania":"Africa","madagascar":"Africa",
  "sub-saharan":"Africa","central africa":"Africa","east africa":"Africa",
  "southern africa":"Africa","west africa":"Africa",
  "asia":"Asia","china":"Asia","mongolia":"Asia","india":"Asia",
  "japan":"Asia","korea":"Asia","central asia":"Asia",
  "southeast asia":"Asia","middle east":"Asia","pakistan":"Asia",
  "gobi":"Asia","himalayas":"Asia","eastern asia":"Asia",
  "australia":"Australia","oceania":"Australia","new zealand":"Australia",
  "antarctica":"Antarctica","antarctic":"Antarctica",
};

const ALL_CONTINENTS = [
  "North America","South America","Europe","Africa","Asia","Australia","Antarctica"
];

function getHighlighted(regions?: string[], habitat?: string): Set<string> {
  const h = new Set<string>();

  if (regions && regions.length > 0) {
    const lower = regions.map((r) => r.toLowerCase());
    if (lower.some((r) => r.includes("worldwide") || r.includes("global") || r === "all")) {
      ALL_CONTINENTS.forEach((c) => h.add(c));
      return h;
    }
    for (const r of regions) {
      const alias = ALIASES[r.toLowerCase()];
      if (alias) { h.add(alias); continue; }
      if (ALL_CONTINENTS.includes(r)) { h.add(r); continue; }
      for (const [a, cont] of Object.entries(ALIASES)) {
        if (r.toLowerCase().includes(a)) h.add(cont);
      }
    }
    if (h.size > 0) return h;
  }

  if (habitat) {
    const hb = habitat.toLowerCase();
    if (hb.includes("worldwide") || hb.includes("global")) {
      ALL_CONTINENTS.forEach((c) => h.add(c));
      return h;
    }
    for (const [a, cont] of Object.entries(ALIASES)) {
      if (hb.includes(a)) h.add(cont);
    }
  }
  return h;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getMapLabel(mya?: string): string {
  if (!mya) return "Known fossil sites";
  const l = mya.toLowerCase().trim();
  if (l === "present" || l === "extant" || l.includes("present")) return "Current range";
  return "Known fossil sites";
}

/* ─── Component ──────────────────────────────────────────────── */
export function WorldMap({ regions, habitat, glowColor, mya }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loaded, setLoaded] = useState(false);

  const accent = glowColor ?? "#b45309";
  const highlighted = getHighlighted(regions, habitat);
  const noHighlight = highlighted.size === 0;
  const label = getMapLabel(mya);

  useEffect(() => {
    const d3 = (window as any).d3;
    const topojson = (window as any).topojson;
    if (!d3 || !topojson || !svgRef.current) return;

    setLoaded(false);
    const svg = svgRef.current;
    const d3svg = d3.select(svg);
    d3svg.selectAll("*").remove();

    /* Fixed logical canvas — SVG scales via viewBox */
    const W = 960, H = 500;
    d3svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");

    /* Ocean background */
    d3svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#1a2a4a");

    const projection = d3.geoNaturalEarth1().scale(153).translate([W / 2, H / 2]);
    const pathGen = d3.geoPath().projection(projection);

    /* Graticule (subtle grid) */
    const graticule = d3.geoGraticule().step([30, 30]);
    d3svg.append("path")
      .datum(graticule())
      .attr("d", pathGen)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.04)")
      .attr("stroke-width", 0.5);

    /* Sphere outline */
    d3svg.append("path")
      .datum({ type: "Sphere" })
      .attr("d", pathGen)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.08)")
      .attr("stroke-width", 1);

    loadWorld().then((world: any) => {
      if (!svgRef.current) return;

      const countries = topojson.feature(world, world.objects.countries);

      /* Country fills */
      d3svg.selectAll("path.country")
        .data((countries as any).features)
        .join("path")
        .attr("class", "country")
        .attr("d", pathGen as any)
        .attr("fill", (d: any) => {
          const cont = C[+d.id];
          if (!cont) return "#2a4060";
          if (noHighlight) return "#3a5a7a";
          return highlighted.has(cont) ? accent : "#2a4060";
        })
        .attr("stroke", (d: any) => {
          const cont = C[+d.id];
          if (!noHighlight && cont && highlighted.has(cont)) return "rgba(255,255,255,0.4)";
          return "rgba(255,255,255,0.1)";
        })
        .attr("stroke-width", (d: any) => {
          const cont = C[+d.id];
          return (!noHighlight && cont && highlighted.has(cont)) ? 0.8 : 0.4;
        });

      setLoaded(true);
    });

    return () => { d3svg.selectAll("*").remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions?.join(","), habitat, accent]);

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden bg-[#1a2a4a] ring-1 ring-white/15 shadow-lg" style={{ height: 180 }}>
        <svg ref={svgRef} style={{ width: "100%", height: "100%", display: "block" }} />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-white/25 font-serif italic">Loading map…</span>
          </div>
        )}
      </div>
      <p className="text-xs text-card-foreground/45 font-serif italic text-center">
        {noHighlight
          ? "Habitat region not mapped"
          : `${label} — ${Array.from(highlighted).join(" · ")}`}
      </p>
    </div>
  );
}
