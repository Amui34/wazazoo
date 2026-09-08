// Logo WAZAZOO : la mascotte « tête à deux vinyles » (piste 8b) — tête rose,
// yeux vinyles jaune & turquoise, sourire — + wordmark. `showText` = mark + wordmark.
export function Logo({
  size = 30,
  showText = true,
  className = "",
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  const h = (size * 72) / 76;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={h}
        viewBox="0 0 76 72"
        fill="none"
        aria-hidden
        style={{ display: "block", filter: "drop-shadow(0 2px 6px rgba(255,61,130,0.28))" }}
      >
        <rect x="2" y="6" width="72" height="60" rx="18" fill="#FF3D82" stroke="#2A1240" strokeWidth="3" />
        {/* œil vinyle gauche */}
        <circle cx="24" cy="30" r="13.5" fill="#2A1240" />
        <circle cx="24" cy="30" r="10" fill="none" stroke="#FFF3E2" strokeWidth="0.9" opacity="0.3" />
        <circle cx="24" cy="30" r="5.4" fill="#FFCE2E" />
        <circle cx="24" cy="30" r="2.2" fill="#2A1240" />
        <circle cx="20.6" cy="26.6" r="1.8" fill="#FFF3E2" />
        {/* œil vinyle droit */}
        <circle cx="52" cy="30" r="13.5" fill="#2A1240" />
        <circle cx="52" cy="30" r="10" fill="none" stroke="#FFF3E2" strokeWidth="0.9" opacity="0.3" />
        <circle cx="52" cy="30" r="5.4" fill="#21D0C3" />
        <circle cx="52" cy="30" r="2.2" fill="#2A1240" />
        <circle cx="48.6" cy="26.6" r="1.8" fill="#FFF3E2" />
        {/* sourire */}
        <path d="M28 51 q10 9 20 1" stroke="#2A1240" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
      {showText && (
        <span className="text-lg font-black tracking-tight text-white" style={{ letterSpacing: "-0.01em" }}>
          WAZAZOO
        </span>
      )}
    </span>
  );
}
