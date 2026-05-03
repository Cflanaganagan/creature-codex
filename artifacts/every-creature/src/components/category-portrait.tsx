/* Diamond-split category portrait — theHunter inspired field-guide style */

const COLORS: Record<string, { bg: string; light: string; dark: string }> = {
  "Theropods":                { bg: "#b45309", light: "rgba(255,200,80,0.18)",  dark: "rgba(0,0,0,0.28)" },
  "Sauropods":                { bg: "#0f766e", light: "rgba(120,255,220,0.18)", dark: "rgba(0,0,0,0.28)" },
  "Ceratopsians":             { bg: "#c2410c", light: "rgba(255,180,80,0.18)",  dark: "rgba(0,0,0,0.28)" },
  "Armoured Dinosaurs":       { bg: "#4d7c0f", light: "rgba(180,255,80,0.18)",  dark: "rgba(0,0,0,0.28)" },
  "Pterosaurs":               { bg: "#0369a1", light: "rgba(80,200,255,0.18)",  dark: "rgba(0,0,0,0.28)" },
  "Marine Reptiles":          { bg: "#0e7490", light: "rgba(80,240,255,0.18)",  dark: "rgba(0,0,0,0.28)" },
  "Prehistoric Fish":         { bg: "#475569", light: "rgba(180,200,255,0.18)", dark: "rgba(0,0,0,0.28)" },
  "Giant Prehistoric Insects":{ bg: "#3f6212", light: "rgba(200,255,80,0.18)",  dark: "rgba(0,0,0,0.28)" },
  "Synapsids":                { bg: "#92400e", light: "rgba(255,200,120,0.18)", dark: "rgba(0,0,0,0.28)" },
  "Ice Age Megafauna":        { bg: "#334155", light: "rgba(180,220,255,0.18)", dark: "rgba(0,0,0,0.28)" },
  "Prehistoric Mammals":      { bg: "#b45309", light: "rgba(255,220,120,0.18)", dark: "rgba(0,0,0,0.28)" },
  "Living Animals":           { bg: "#15803d", light: "rgba(120,255,140,0.18)", dark: "rgba(0,0,0,0.28)" },
  "Recently Extinct":         { bg: "#9f1239", light: "rgba(255,120,140,0.18)", dark: "rgba(0,0,0,0.28)" },
  "Mystery Creatures":        { bg: "#581c87", light: "rgba(200,120,255,0.18)", dark: "rgba(0,0,0,0.28)" },
};

/* ── Individual creature face SVGs (0 0 100 100 viewBox) ──────────────── */

function TRexFace() {
  return <>
    <path d="M15 85 Q20 65 30 55 Q38 48 46 48" stroke="rgba(255,255,255,0.45)" strokeWidth="13" strokeLinecap="round" fill="none"/>
    <ellipse cx="52" cy="42" rx="18" ry="14" fill="rgba(255,255,255,0.18)" transform="rotate(-15 52 42)"/>
    <path d="M55 50 Q70 44 90 41 Q95 45 93 53 Q85 58 70 58 Q58 57 55 50Z" fill="rgba(255,255,255,0.2)"/>
    <circle cx="45" cy="36" r="7" fill="rgba(0,0,0,0.5)"/>
    <circle cx="46" cy="35" r="3.5" fill="rgba(255,165,0,0.8)"/>
    <circle cx="46" cy="35" r="1.8" fill="#000"/>
    <path d="M62 55 L65 64 L68 55 L71 64 L74 55 L77 64 L80 55 L83 64 L86 55 L89 64 L92 55" stroke="rgba(255,255,255,0.88)" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <ellipse cx="82" cy="45" rx="3" ry="2" fill="rgba(0,0,0,0.25)"/>
    <path d="M36 60 Q40 65 44 63 Q42 60 39 58Z" fill="rgba(255,255,255,0.25)"/>
  </>
}

function BrachiosaurusFace() {
  return <>
    <ellipse cx="30" cy="82" rx="22" ry="14" fill="rgba(255,255,255,0.16)"/>
    <path d="M34 80 Q32 62 35 44 Q40 24 58 14" stroke="rgba(255,255,255,0.75)" strokeWidth="11" strokeLinecap="round" fill="none"/>
    <ellipse cx="63" cy="11" rx="11" ry="8" fill="rgba(255,255,255,0.88)" transform="rotate(-20 63 11)"/>
    <ellipse cx="68" cy="7" rx="2.5" ry="1.8" fill="rgba(0,0,0,0.35)"/>
    <circle cx="60" cy="10" r="2.5" fill="rgba(0,0,0,0.6)"/>
    <circle cx="61" cy="9.2" r="1.1" fill="rgba(255,255,255,0.5)"/>
    <path d="M58 20 Q62 26 60 32" stroke="rgba(255,255,255,0.2)" strokeWidth="4" strokeLinecap="round" fill="none"/>
  </>
}

function TriceratopsFace() {
  return <>
    <ellipse cx="50" cy="42" rx="40" ry="32" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <path d="M12 46 Q22 16 50 10 Q78 16 88 46" stroke="rgba(255,255,255,0.22)" strokeWidth="7" fill="none" strokeLinecap="round"/>
    <ellipse cx="50" cy="66" rx="26" ry="20" fill="rgba(255,255,255,0.18)"/>
    <path d="M28 44 L20 12 L36 44" fill="rgba(255,255,255,0.78)"/>
    <path d="M72 44 L80 12 L64 44" fill="rgba(255,255,255,0.78)"/>
    <path d="M43 54 L50 34 L57 54" fill="rgba(255,255,255,0.62)"/>
    <circle cx="34" cy="62" r="5" fill="rgba(0,0,0,0.5)"/>
    <circle cx="66" cy="62" r="5" fill="rgba(0,0,0,0.5)"/>
    <circle cx="35" cy="61" r="2.5" fill="rgba(255,200,0,0.7)"/>
    <circle cx="67" cy="61" r="2.5" fill="rgba(255,200,0,0.7)"/>
    <path d="M42 78 Q50 86 58 78 Q54 84 50 87 Q46 84 42 78Z" fill="rgba(255,255,255,0.7)"/>
  </>
}

function AnkylosaurusFace() {
  return <>
    <ellipse cx="50" cy="64" rx="38" ry="22" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    {[{cx:35,cy:52,r:5.5},{cx:50,cy:47,r:6},{cx:65,cy:52,r:5.5},{cx:28,cy:64,r:4.5},{cx:42,cy:61,r:4},{cx:58,cy:61,r:4},{cx:72,cy:64,r:4.5}].map((c,i)=>
      <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="rgba(255,255,255,0.22)"/>
    )}
    <path d="M12 56 L18 42 L21 58" fill="rgba(255,255,255,0.55)"/>
    <path d="M88 56 L82 42 L79 58" fill="rgba(255,255,255,0.55)"/>
    <path d="M14 68 L20 56 L23 70" fill="rgba(255,255,255,0.4)"/>
    <path d="M86 68 L80 56 L77 70" fill="rgba(255,255,255,0.4)"/>
    <ellipse cx="50" cy="40" rx="18" ry="12" fill="rgba(255,255,255,0.18)"/>
    <circle cx="40" cy="38" r="3" fill="rgba(0,0,0,0.45)"/>
    <circle cx="60" cy="38" r="3" fill="rgba(0,0,0,0.45)"/>
    <ellipse cx="50" cy="83" rx="11" ry="7" fill="rgba(255,255,255,0.32)"/>
  </>
}

function QuetzalcoatlusFace() {
  return <>
    <path d="M58 36 Q46 12 22 6 Q18 9 22 13 Q44 20 52 44" fill="rgba(255,255,255,0.72)"/>
    <path d="M58 36 Q78 28 98 30 Q102 35 98 42 Q78 44 58 48Z" fill="rgba(255,255,255,0.78)"/>
    <ellipse cx="83" cy="37" rx="3.5" ry="2" fill="rgba(0,0,0,0.28)"/>
    <circle cx="60" cy="34" r="5" fill="rgba(0,0,0,0.5)"/>
    <circle cx="61.5" cy="32.5" r="2.2" fill="rgba(255,210,0,0.75)"/>
    <circle cx="61.5" cy="32.5" r="1.1" fill="black"/>
    <path d="M54 48 Q49 62 46 76" stroke="rgba(255,255,255,0.48)" strokeWidth="8" strokeLinecap="round" fill="none"/>
    <path d="M46 76 Q22 58 8 38 Q12 33 18 36 Q34 55 46 74" fill="rgba(255,255,255,0.14)"/>
    <ellipse cx="45" cy="80" rx="12" ry="8" fill="rgba(255,255,255,0.14)"/>
  </>
}

function MosasaurusFace() {
  return <>
    <path d="M6 32 Q28 20 62 24 Q80 26 88 34 Q84 40 62 36 Q28 32 6 42Z" fill="rgba(255,255,255,0.18)"/>
    <path d="M6 42 Q28 52 62 48 Q80 46 88 38 Q84 38 62 44 Q28 40 6 36Z" fill="rgba(255,255,255,0.14)"/>
    <path d="M16 34 L19 44 L23 34 L27 44 L31 34 L35 44 L39 34 L43 44 L47 34 L51 44 L55 34 L59 44 L63 34 L66 44 L69 34 L72 44 L75 34" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <circle cx="64" cy="26" r="6" fill="rgba(0,0,0,0.5)"/>
    <circle cx="65.5" cy="24.5" r="3" fill="rgba(255,180,0,0.72)"/>
    <circle cx="65.5" cy="24.5" r="1.5" fill="black"/>
    <path d="M88 34 Q96 36 98 44 Q94 50 90 46 Q86 40 88 36" fill="rgba(255,255,255,0.16)"/>
    <path d="M2 48 Q6 54 10 50" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" fill="none"/>
    <path d="M2 58 Q30 70 60 64 Q78 60 88 52" stroke="rgba(255,255,255,0.15)" strokeWidth="4" strokeLinecap="round" fill="none"/>
  </>
}

function MegalodonFace() {
  return <>
    <path d="M50 6 Q72 10 86 28 Q94 40 86 56 Q72 68 50 70 Q28 68 14 56 Q6 40 14 28 Q28 10 50 6Z" fill="rgba(255,255,255,0.14)"/>
    <path d="M28 46 Q40 38 50 36 Q60 38 72 46" stroke="rgba(255,255,255,0.45)" strokeWidth="4" fill="none" strokeLinecap="round"/>
    <path d="M29 46 L33 60 L38 46 L43 62 L48 46 L53 62 L58 46 L63 62 L68 46 L71 58" stroke="rgba(255,255,255,0.92)" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
    <path d="M26 52 Q38 60 50 62 Q62 60 74 52" fill="rgba(255,255,255,0.11)"/>
    <path d="M30 53 L33 62 L37 53 L41 62 L45 53 L49 62 L53 53 L57 62 L61 53 L65 62 L69 53" stroke="rgba(255,255,255,0.72)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <circle cx="30" cy="30" r="8" fill="rgba(0,0,0,0.5)"/>
    <circle cx="70" cy="30" r="8" fill="rgba(0,0,0,0.5)"/>
    <circle cx="31" cy="29" r="3.5" fill="rgba(30,30,50,0.8)"/>
    <circle cx="71" cy="29" r="3.5" fill="rgba(30,30,50,0.8)"/>
    <path d="M22 44 Q18 42 15 44 Q18 46 22 46" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" fill="none"/>
    <path d="M78 44 Q82 42 85 44 Q82 46 78 46" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" fill="none"/>
  </>
}

function MeganeuraFace() {
  return <>
    <path d="M50 44 L16 18 L12 28 L48 50" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.38)" strokeWidth="0.8"/>
    <path d="M50 44 L84 18 L88 28 L52 50" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.38)" strokeWidth="0.8"/>
    <path d="M50 52 L14 38 L12 48 L49 58" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
    <path d="M50 52 L86 38 L88 48 L51 58" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
    <ellipse cx="50" cy="52" rx="6" ry="24" fill="rgba(255,255,255,0.28)"/>
    <ellipse cx="50" cy="75" rx="4" ry="3" fill="rgba(255,255,255,0.2)"/>
    <circle cx="36" cy="32" r="15" fill="rgba(255,255,255,0.65)"/>
    <circle cx="64" cy="32" r="15" fill="rgba(255,255,255,0.65)"/>
    <circle cx="36" cy="32" r="11" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5"/>
    <circle cx="64" cy="32" r="11" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5"/>
    <circle cx="36" cy="32" r="6" fill="rgba(0,140,70,0.55)"/>
    <circle cx="64" cy="32" r="6" fill="rgba(0,140,70,0.55)"/>
    <circle cx="36" cy="32" r="3" fill="rgba(0,0,0,0.65)"/>
    <circle cx="64" cy="32" r="3" fill="rgba(0,0,0,0.65)"/>
    <path d="M40 18 L32 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M60 18 L68 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
  </>
}

function DimetrodonFace() {
  return <>
    <path d="M28 74 Q34 18 50 10 Q58 18 60 74" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.38)" strokeWidth="1"/>
    {[{x1:33,y1:74,x2:34,y2:20},{x1:38,y1:74,x2:40,y2:13},{x1:44,y1:74,x2:47,y2:10},{x1:49,y1:74,x2:53,y2:11},{x1:55,y1:74,x2:58,y2:16}].map((l,i)=>
      <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(255,255,255,0.42)" strokeWidth="1.3" strokeLinecap="round"/>
    )}
    <path d="M26 74 Q52 66 82 74 Q85 82 78 86 Q52 90 20 84 Q16 78 26 74Z" fill="rgba(255,255,255,0.18)"/>
    <path d="M20 84 Q8 87 6 82 Q8 76 20 78" fill="rgba(255,255,255,0.18)"/>
    <path d="M82 74 Q94 64 98 72 Q96 82 84 84 Q80 82 82 74Z" fill="rgba(255,255,255,0.18)"/>
    <circle cx="91" cy="72" r="3.5" fill="rgba(0,0,0,0.5)"/>
    <circle cx="92" cy="71" r="1.8" fill="rgba(255,160,0,0.7)"/>
    <path d="M86 76 L88 83 L91 76 L93 83 L96 76" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </>
}

function WoollyMammothFace() {
  return <>
    <ellipse cx="50" cy="36" rx="24" ry="26" fill="rgba(255,255,255,0.14)"/>
    <path d="M26 30 Q18 18 22 10 Q28 6 33 10 Q26 18 30 28" fill="rgba(255,255,255,0.18)"/>
    <path d="M74 30 Q82 18 78 10 Q72 6 67 10 Q74 18 70 28" fill="rgba(255,255,255,0.18)"/>
    <path d="M22 12 Q18 4 26 8" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <path d="M78 12 Q82 4 74 8" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <circle cx="50" cy="34" r="22" fill="rgba(255,255,255,0.12)"/>
    <path d="M35 58 Q16 74 12 92 Q18 97 22 90 Q24 76 40 62" stroke="rgba(255,255,255,0.92)" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <path d="M65 58 Q84 74 88 92 Q82 97 78 90 Q76 76 60 62" stroke="rgba(255,255,255,0.92)" strokeWidth="5" fill="none" strokeLinecap="round"/>
    <path d="M43 58 Q36 74 38 90 Q50 98 62 90 Q64 74 57 58" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
    <circle cx="35" cy="28" r="5.5" fill="rgba(0,0,0,0.5)"/>
    <circle cx="65" cy="28" r="5.5" fill="rgba(0,0,0,0.5)"/>
    <circle cx="36" cy="27" r="2.8" fill="rgba(80,50,20,0.8)"/>
    <circle cx="66" cy="27" r="2.8" fill="rgba(80,50,20,0.8)"/>
    <ellipse cx="24" cy="20" rx="8" ry="10" fill="rgba(255,255,255,0.12)"/>
    <ellipse cx="76" cy="20" rx="8" ry="10" fill="rgba(255,255,255,0.12)"/>
  </>
}

function SmiledonFace() {
  return <>
    <circle cx="50" cy="44" r="32" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
    <path d="M20 26 L16 8 L34 22" fill="rgba(255,255,255,0.3)"/>
    <path d="M22 24 L19 12 L32 21" fill="rgba(0,0,0,0.18)"/>
    <path d="M80 26 L84 8 L66 22" fill="rgba(255,255,255,0.3)"/>
    <path d="M78 24 L81 12 L68 21" fill="rgba(0,0,0,0.18)"/>
    <ellipse cx="37" cy="38" rx="9" ry="8" fill="rgba(0,0,0,0.5)"/>
    <ellipse cx="63" cy="38" rx="9" ry="8" fill="rgba(0,0,0,0.5)"/>
    <ellipse cx="37" cy="38" rx="6" ry="7" fill="rgba(200,155,0,0.72)"/>
    <ellipse cx="63" cy="38" rx="6" ry="7" fill="rgba(200,155,0,0.72)"/>
    <ellipse cx="37" cy="38" rx="2" ry="5.5" fill="rgba(0,0,0,0.92)"/>
    <ellipse cx="63" cy="38" rx="2" ry="5.5" fill="rgba(0,0,0,0.92)"/>
    <path d="M44 52 Q50 57 56 52 L54 49 L50 51 L46 49Z" fill="rgba(255,160,160,0.6)"/>
    {[35,28,65,72].map((x,i)=><circle key={i} cx={x} cy={56} r={1.8} fill="rgba(255,255,255,0.45)"/>)}
    <path d="M37 60 Q34 74 35 86 Q39 91 42 86 Q44 74 43 60" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.95)" strokeWidth="0.6"/>
    <path d="M63 60 Q66 74 65 86 Q61 91 58 86 Q56 74 57 60" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.95)" strokeWidth="0.6"/>
  </>
}

function LionFace() {
  return <>
    <circle cx="50" cy="50" r="42" fill="rgba(255,255,255,0.17)" stroke="rgba(255,255,255,0.26)" strokeWidth="2"/>
    {[[50,8,50,26],[66,12,60,28],[78,22,68,34],[84,38,68,44],[82,54,68,50],[74,68,62,58],[60,78,54,64],[50,82,50,66],[40,78,46,64],[26,68,38,58],[18,54,32,50],[16,38,32,44],[22,22,32,34],[34,12,40,28]].map(([x1,y1,x2,y2],i)=>
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.18)" strokeWidth="4" strokeLinecap="round"/>
    )}
    <circle cx="50" cy="48" r="26" fill="rgba(255,255,255,0.14)"/>
    <ellipse cx="38" cy="42" rx="7" ry="6" fill="rgba(0,0,0,0.5)"/>
    <ellipse cx="62" cy="42" rx="7" ry="6" fill="rgba(0,0,0,0.5)"/>
    <ellipse cx="38" cy="42" rx="4.5" ry="5" fill="rgba(200,150,0,0.72)"/>
    <ellipse cx="62" cy="42" rx="4.5" ry="5" fill="rgba(200,150,0,0.72)"/>
    <ellipse cx="38" cy="42" rx="1.8" ry="4.5" fill="rgba(0,0,0,0.92)"/>
    <ellipse cx="62" cy="42" rx="1.8" ry="4.5" fill="rgba(0,0,0,0.92)"/>
    <path d="M43 55 Q50 61 57 55 Q53 52 50 53 Q47 52 43 55Z" fill="rgba(255,160,150,0.62)"/>
    <path d="M47 59 Q50 64 53 59" stroke="rgba(255,255,255,0.35)" strokeWidth="1.3" fill="none"/>
  </>
}

function DodoFace() {
  return <>
    <ellipse cx="19" cy="58" rx="13" ry="6" fill="rgba(255,255,255,0.18)" transform="rotate(-25 19 58)"/>
    <ellipse cx="16" cy="66" rx="11" ry="5" fill="rgba(255,255,255,0.12)" transform="rotate(-32 16 66)"/>
    <ellipse cx="50" cy="65" rx="30" ry="24" fill="rgba(255,255,255,0.88)"/>
    <ellipse cx="45" cy="63" rx="17" ry="9" fill="rgba(255,255,255,0.2)" transform="rotate(-14 45 63)"/>
    <path d="M38 46 Q42 34 54 28" stroke="rgba(255,255,255,0.85)" strokeWidth="11" strokeLinecap="round" fill="none"/>
    <circle cx="58" cy="24" r="18" fill="rgba(255,255,255,0.88)"/>
    <path d="M74 19 Q94 13 96 22 Q94 30 84 32 Q75 32 70 26Z" fill="rgba(255,255,255,0.9)"/>
    <path d="M82 32 Q93 35 93 42 Q89 46 83 42 Q78 38 80 30" fill="rgba(255,255,255,0.82)"/>
    <circle cx="64" cy="19" r="5" fill="rgba(0,0,0,0.58)"/>
    <circle cx="65.5" cy="17.5" r="2.2" fill="rgba(255,255,255,0.72)"/>
    <path d="M44 86 L41 100" stroke="rgba(255,255,255,0.65)" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M37 100 L45 100 L41 100 L41 103 L38 103" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M57 86 L54 100" stroke="rgba(255,255,255,0.5)" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M50 100 L58 100 L54 100 L54 103 L51 103" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </>
}

function MysteryFace() {
  return <>
    <circle cx="32" cy="28" r="2" fill="rgba(255,255,255,0.16)"/>
    <circle cx="72" cy="22" r="2.5" fill="rgba(255,255,255,0.12)"/>
    <circle cx="18" cy="55" r="1.5" fill="rgba(255,255,255,0.16)"/>
    <circle cx="80" cy="62" r="2" fill="rgba(255,255,255,0.12)"/>
    <circle cx="28" cy="80" r="2" fill="rgba(255,255,255,0.16)"/>
    <circle cx="75" cy="80" r="1.5" fill="rgba(255,255,255,0.12)"/>
    <path d="M36 34 Q34 16 50 14 Q66 12 70 26 Q74 40 62 50 Q56 56 56 68"
      stroke="rgba(255,255,255,0.78)" strokeWidth="7" fill="none" strokeLinecap="round"/>
    <circle cx="56" cy="80" r="5.5" fill="rgba(255,255,255,0.78)"/>
    <path d="M28 72 Q18 50 28 35 Q38 20 55 22 Q72 24 76 38 Q80 52 66 62 Q58 68 56 78"
      stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" strokeLinecap="round"/>
  </>
}

const FACES: Record<string, () => React.ReactElement> = {
  "Theropods":                 TRexFace,
  "Sauropods":                 BrachiosaurusFace,
  "Ceratopsians":              TriceratopsFace,
  "Armoured Dinosaurs":        AnkylosaurusFace,
  "Pterosaurs":                QuetzalcoatlusFace,
  "Marine Reptiles":           MosasaurusFace,
  "Prehistoric Fish":          MegalodonFace,
  "Giant Prehistoric Insects": MeganeuraFace,
  "Synapsids":                 DimetrodonFace,
  "Ice Age Megafauna":         WoollyMammothFace,
  "Prehistoric Mammals":       SmiledonFace,
  "Living Animals":            LionFace,
  "Recently Extinct":          DodoFace,
  "Mystery Creatures":         MysteryFace,
};

interface Props {
  category: string;
  className?: string;
}

export function CategoryPortrait({ category, className = "" }: Props) {
  const colors = COLORS[category] ?? { bg: "#334155", light: "rgba(200,220,255,0.16)", dark: "rgba(0,0,0,0.28)" };
  const Face = FACES[category] ?? MysteryFace;

  return (
    <div className={`relative aspect-square ${className}`}>
      {/* Diamond clip */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
      >
        {/* Solid background */}
        <div className="absolute inset-0" style={{ backgroundColor: colors.bg }} />

        {/* Diagonal split: top-left lighter, bottom-right darker */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(315deg, ${colors.dark} 50%, ${colors.light} 50%)`,
          }}
        />

        {/* SVG creature face */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Face />
        </svg>
      </div>

      {/* Diamond border ring */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)",
        }}
      />
    </div>
  );
}
