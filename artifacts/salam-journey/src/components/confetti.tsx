import { useMemo } from "react";

const PALETTE = [
  "var(--sage)",
  "var(--sage-dark)",
  "var(--sage-light)",
  "var(--blush)",
  "var(--blush-light)",
  "var(--cream-dark)",
];

/**
 * Pure-CSS confetti burst. Renders a fixed number of colored squares
 * that animate outward and fade. Mount conditionally — it's not
 * meant to loop.
 */
export function Confetti({ count = 28 }: { count?: number }) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 140;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const rotate = (Math.random() - 0.5) * 540;
      const delay = Math.random() * 120;
      const duration = 900 + Math.random() * 700;
      const size = 6 + Math.random() * 8;
      const color = PALETTE[i % PALETTE.length];
      const radius = Math.random() > 0.5 ? "999px" : "2px";
      return { dx, dy, rotate, delay, duration, size, color, radius };
    });
  }, [count]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
      style={{ zIndex: 1 }}
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          style={
            {
              position: "absolute",
              top: "50%",
              insetInlineStart: "50%",
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              borderRadius: p.radius,
              opacity: 0,
              animation: `confetti-burst ${p.duration}ms cubic-bezier(.2,.8,.2,1) ${p.delay}ms forwards`,
              ["--cf-x" as never]: `${p.dx}px`,
              ["--cf-y" as never]: `${p.dy}px`,
              ["--cf-r" as never]: `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
