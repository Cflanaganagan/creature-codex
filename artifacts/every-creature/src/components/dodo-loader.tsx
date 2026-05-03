import { useState, useEffect } from "react";
import dodoImg from "@/assets/dodo.png";

const FLAVOUR = [
  "Consulting the fossil record...",
  "Excavating the archives...",
  "Disturbing a very old skeleton...",
  "Asking the palaeontologists...",
  "Rummaging through the Cretaceous...",
];

const ANIM_CSS = `
@keyframes dodo-waddle {
  0%, 100% { transform: rotate(-3deg); }
  50%       { transform: rotate(3deg); }
}
@keyframes grass-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-200px); }
}
`;

export function DodoLoader() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % FLAVOUR.length);
        setVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{ANIM_CSS}</style>

      <div className="flex flex-col items-center select-none py-6">

        {/* Scene: dodo + grass layered together */}
        <div style={{ position: "relative", width: 160, display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Dodo — z-index 1, sits behind the grass */}
          <div
            style={{
              transformOrigin: "bottom center",
              animation: "dodo-waddle 0.5s ease-in-out infinite",
              lineHeight: 0,
              position: "relative",
              zIndex: 1,
            }}
          >
            <img
              src={dodoImg}
              alt="Loading…"
              style={{ height: 90, width: "auto", display: "block" }}
              draggable={false}
            />
          </div>

          {/*
            Grass strip — z-index 2 so it renders IN FRONT of the dodo legs.
            Pulled up with negative margin to overlap the dodo's lower leg area.
            Taller (38px) and with more pronounced waves so it reads as real grass.
          */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              marginTop: -28,
              width: 200,
              height: 38,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/*
              SVG is 400px wide. Wave repeats every 20px → 10 waves = 200px.
              Scrolling 200px left is a seamless loop.
            */}
            <svg
              width="400"
              height="38"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                animation: "grass-scroll 1.8s linear infinite",
              }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Dark background fill so grass sits on a solid base */}
              <rect width="400" height="38" fill="#2a3a28" />

              {/* Main wavy grass top — mid-tone green */}
              <path
                d="
                  M0,14
                  Q5,8  10,14  Q15,20 20,14
                  Q25,8  30,14 Q35,20 40,14
                  Q45,8  50,14 Q55,20 60,14
                  Q65,8  70,14 Q75,20 80,14
                  Q85,8  90,14 Q95,20 100,14
                  Q105,8 110,14 Q115,20 120,14
                  Q125,8 130,14 Q135,20 140,14
                  Q145,8 150,14 Q155,20 160,14
                  Q165,8 170,14 Q175,20 180,14
                  Q185,8 190,14 Q195,20 200,14
                  Q205,8 210,14 Q215,20 220,14
                  Q225,8 230,14 Q235,20 240,14
                  Q245,8 250,14 Q255,20 260,14
                  Q265,8 270,14 Q275,20 280,14
                  Q285,8 290,14 Q295,20 300,14
                  Q305,8 310,14 Q315,20 320,14
                  Q325,8 330,14 Q335,20 340,14
                  Q345,8 350,14 Q355,20 360,14
                  Q365,8 370,14 Q375,20 380,14
                  Q385,8 390,14 Q395,20 400,14
                  L400,38 L0,38 Z
                "
                fill="#4a6a3a"
              />

              {/* Lighter highlight layer — slightly offset wave for depth */}
              <path
                d="
                  M0,18
                  Q5,13 10,18 Q15,23 20,18
                  Q25,13 30,18 Q35,23 40,18
                  Q45,13 50,18 Q55,23 60,18
                  Q65,13 70,18 Q75,23 80,18
                  Q85,13 90,18 Q95,23 100,18
                  Q105,13 110,18 Q115,23 120,18
                  Q125,13 130,18 Q135,23 140,18
                  Q145,13 150,18 Q155,23 160,18
                  Q165,13 170,18 Q175,23 180,18
                  Q185,13 190,18 Q195,23 200,18
                  Q205,13 210,18 Q215,23 220,18
                  Q225,13 230,18 Q235,23 240,18
                  Q245,13 250,18 Q255,23 260,18
                  Q265,13 270,18 Q275,23 280,18
                  Q285,13 290,18 Q295,23 300,18
                  Q305,13 310,18 Q315,23 320,18
                  Q325,13 330,18 Q335,23 340,18
                  Q345,13 350,18 Q355,23 360,18
                  Q365,13 370,18 Q375,23 380,18
                  Q385,13 390,18 Q395,23 400,18
                  L400,38 L0,38 Z
                "
                fill="#3d5a30"
              />

              {/* Individual grass blades — vertical strokes */}
              {Array.from({ length: 22 }, (_, i) => {
                const x = i * 18 + 5;
                const h = 8 + (i % 3) * 3;
                return (
                  <line
                    key={i}
                    x1={x} y1={14 - h}
                    x2={x + (i % 2 === 0 ? -2 : 2)} y2={14}
                    stroke="#5a7a48"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Cycling loading phrase — matches original throbber style */}
        <p
          className="text-sm font-serif italic text-center mt-4"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(3px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            minHeight: "1.25rem",
            color: "rgba(128,128,128,0.7)",
          }}
        >
          {FLAVOUR[phraseIndex]}
        </p>
      </div>
    </>
  );
}
