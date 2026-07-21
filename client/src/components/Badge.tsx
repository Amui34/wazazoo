import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" }) {
  const toneClasses =
    tone === "success"
      ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
      : "border-neutral-700 bg-neutral-900 text-neutral-300";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${toneClasses}`}>
      {children}
    </span>
  );
}
