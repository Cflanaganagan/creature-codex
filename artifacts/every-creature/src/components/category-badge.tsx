import { motion } from "framer-motion";

/**
 * CategoryBadge — renders a badge image with a pulsing coloured glow.
 *
 * mix-blend-mode: screen fades the black background into whatever is
 * behind it. clip-path is intentionally NOT used on the container
 * (doing so creates a stacking context that traps blend mode inside it).
 */
interface CategoryBadgeProps {
  src: string;
  alt: string;
  glowColor?: string;
  className?: string;
}

export function CategoryBadge({ src, alt, glowColor, className = "" }: CategoryBadgeProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Pulsing glow layer — sits behind the image */}
      {glowColor && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${glowColor}88 0%, ${glowColor}22 50%, transparent 75%)`,
          }}
          animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Badge image — black fades via screen blend, no clip-path so full face shows */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full object-contain relative z-10"
        style={{ mixBlendMode: "screen" }}
      />
    </div>
  );
}
