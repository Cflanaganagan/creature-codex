import { motion, useReducedMotion } from "framer-motion";

interface CategoryBadgeProps {
  src: string;
  alt: string;
  glowColor?: string;
  className?: string;
}

export function CategoryBadge({ src, alt, glowColor, className = "" }: CategoryBadgeProps) {
  const reducedMotion = useReducedMotion();
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {glowColor && (
        <motion.div
          className="absolute inset-[12%] rounded-full pointer-events-none blur-md"
          style={{
            background: `radial-gradient(circle, ${glowColor}66 0%, ${glowColor}22 46%, transparent 72%)`,
          }}
          animate={reducedMotion ? { opacity: 0.4 } : { scale: [0.98, 1.025, 0.98], opacity: [0.30, 0.48, 0.30] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <img
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full object-contain relative z-10 transition-transform duration-500"
        style={{
          mixBlendMode: "screen",
          filter: "drop-shadow(0 5px 5px rgba(0,0,0,.22))"
        }}
      />
    </div>
  );
}
