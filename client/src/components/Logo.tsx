// Logo WAZAZOO : un micro détaillé (tête en maille, corps, câble + prise) dans
// un pin de carte en contour, aux couleurs de marque. `showText` = mark + wordmark.
export function Logo({
  size = 30,
  showText = true,
  className = "",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  const h = (size * 62) / 60;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={h}
        viewBox="0 0 60 62"
        fill="none"
        aria-hidden
        style={{ display: "block", filter: "drop-shadow(0 2px 6px rgba(224,97,242,0.3))" }}
      >
        <defs>
          <linearGradient id="wz-grad" x1="8" y1="4" x2="52" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f6b23e" />
            <stop offset="0.5" stopColor="#e061f2" />
            <stop offset="1" stopColor="#9b7bff" />
          </linearGradient>
          <pattern id="wz-mesh" patternUnits="userSpaceOnUse" width="4.4" height="4.4">
            <path d="M0 0 L4.4 4.4 M4.4 0 L0 4.4" stroke="#0c0912" strokeWidth="0.7" opacity="0.55" />
          </pattern>
          <clipPath id="wz-head">
            <ellipse cx="30" cy="21" rx="11.5" ry="13.5" />
          </clipPath>
        </defs>

        {/* Pin de carte, en contour */}
        <path
          d="M30 3.5 C 42 3.5 51 12.5 51 24 C 51 33 44 39 37 50 L 30 59 L 23 50 C 16 39 9 33 9 24 C 9 12.5 18 3.5 30 3.5 Z"
          fill="none"
          stroke="url(#wz-grad)"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* Tête du micro + maille */}
        <ellipse cx="30" cy="21" rx="11.5" ry="13.5" fill="url(#wz-grad)" />
        <g clipPath="url(#wz-head)">
          <rect x="18" y="7" width="24" height="28" fill="url(#wz-mesh)" />
          {/* bandes de grille */}
          <g stroke="#0c0912" strokeWidth="1.1" opacity="0.5">
            <line x1="18" y1="16" x2="42" y2="16" />
            <line x1="18" y1="21" x2="42" y2="21" />
            <line x1="18" y1="26" x2="42" y2="26" />
          </g>
        </g>

        {/* Col + corps du micro */}
        <path d="M24.5 33 L35.5 33 L34 47 C 34 49 32.5 50 30 50 C 27.5 50 26 49 26 47 Z" fill="url(#wz-grad)" />
        {/* Interrupteur */}
        <rect x="27.8" y="38" width="4.4" height="2.6" rx="1.3" fill="#0c0912" opacity="0.55" />
      </svg>
      {showText && (
        <span className="text-lg font-black tracking-tight text-white" style={{ letterSpacing: "-0.01em" }}>
          WAZAZOO
        </span>
      )}
    </span>
  );
}
