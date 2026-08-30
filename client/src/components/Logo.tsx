// Logo WAZAZOO : un pin de carte (les sorties près de toi) dans le dégradé de
// marque + le wordmark. `showText` permet la version marque seule (favicon-like).
export function Logo({
  size = 28,
  showText = true,
  className = "",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        style={{ display: "block", filter: "drop-shadow(0 2px 6px rgba(224,97,242,0.35))" }}
      >
        <defs>
          <linearGradient id="wz-grad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f6b23e" />
            <stop offset="0.5" stopColor="#e061f2" />
            <stop offset="1" stopColor="#9b7bff" />
          </linearGradient>
        </defs>
        {/* Manche du micro se terminant en pointe — silhouette de pin de carte */}
        <path d="M12.4 12.5 h7.2 v9.5 L16 30.5 12.4 22 Z" fill="url(#wz-grad)" />
        {/* Tête / grille du micro */}
        <circle cx="16" cy="10" r="8.4" fill="url(#wz-grad)" />
        {/* Lignes de grille, en négatif */}
        <g stroke="#0c0912" strokeWidth="1.4" strokeLinecap="round">
          <line x1="10.8" y1="7.2" x2="21.2" y2="7.2" />
          <line x1="9.6" y1="10" x2="22.4" y2="10" />
          <line x1="10.8" y1="12.8" x2="21.2" y2="12.8" />
        </g>
      </svg>
      {showText && (
        <span className="text-lg font-black tracking-tight text-white" style={{ letterSpacing: "-0.01em" }}>
          WAZAZOO
        </span>
      )}
    </span>
  );
}
