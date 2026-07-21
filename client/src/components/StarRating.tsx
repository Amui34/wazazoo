export function StarRating({ value, size = "text-base" }: { value: number; size?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={`text-amber-400 ${size}`} aria-label={`${value.toFixed(1)} sur 5`}>
      {"★".repeat(rounded)}
      <span className="text-neutral-700">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}
