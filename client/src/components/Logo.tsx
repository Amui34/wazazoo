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
        <circle cx="16" cy="11.4" r="3.7" fill="#0c0912" />
      </svg>
      {showText && (
        <span className="text-lg font-black tracking-tight text-white" style={{ letterSpacing: "-0.01em" }}>
          WAZAZOO
        </span>
      )}
    </span>
  );
}
