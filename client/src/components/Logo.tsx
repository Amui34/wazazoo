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
        <path
          d="M16 1.5c-5.8 0-10 4.3-10 9.9 0 6.9 8.4 16.4 9.3 17.4a1 1 0 0 0 1.5 0c.9-1 9.3-10.5 9.3-17.4 0-5.6-4.2-9.9-10-9.9Z"
          fill="url(#wz-grad)"
        />
        {/* Micro simple, en négatif (couleur du fond) dans le pin */}
        <g fill="#0c0912">
          <rect x="13.4" y="5.4" width="5.2" height="8" rx="2.6" />
          <rect x="15.4" y="13.2" width="1.2" height="2.3" />
          <rect x="13.2" y="15" width="5.6" height="1.3" rx="0.65" />
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
