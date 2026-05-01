type Props = {
  /** Color of the wave (matches the next section's background). */
  color?: string;
  /** Flip vertically (use when the wave should go bottom-up). */
  flip?: boolean;
  className?: string;
};

/** Soft organic SVG wave used to separate sections. */
export function SectionDivider({ color = "var(--cream)", flip = false, className = "" }: Props) {
  return (
    <div
      className={`w-full leading-none ${className}`}
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="block w-full h-[60px] md:h-[100px]"
      >
        <path
          d="M0,64 C240,120 420,0 720,40 C1020,80 1200,120 1440,60 L1440,120 L0,120 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

/** Decorative blob to layer behind hero sections. */
export function SoftBlob({
  color = "var(--sage-light)",
  className = "",
  style,
}: {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        fill={color}
        d="M421.5,316.5Q401,383,343,422Q285,461,212.5,442.5Q140,424,108,360.5Q76,297,108,232.5Q140,168,206,131Q272,94,338,128Q404,162,427.5,231Q451,300,421.5,316.5Z"
      />
    </svg>
  );
}
