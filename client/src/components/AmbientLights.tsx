// Halos d'ambiance : trio de marque WAZAZOO — violet / fuchsia / ambre.
const BLOBS = [
  { className: "top-[-10%] left-[-8%] h-80 w-80 bg-violet-600/20 animate-float-slow" },
  { className: "top-[-6%] right-[-10%] h-72 w-72 bg-amber-400/15 animate-float-slower" },
  { className: "top-[20%] left-[15%] h-64 w-64 bg-fuchsia-500/15 animate-float-slower", delay: "1.5s" },
  { className: "top-[45%] right-[5%] h-56 w-56 bg-violet-500/12 animate-float-slow", delay: "2.5s" },
  { className: "bottom-[5%] left-[10%] h-72 w-72 bg-fuchsia-600/15 animate-float-slow", delay: "0.8s" },
  { className: "bottom-[-8%] right-[15%] h-64 w-64 bg-amber-400/10 animate-float-slower", delay: "3s" },
];

export function AmbientLights() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          style={blob.delay ? { animationDelay: blob.delay } : undefined}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
        />
      ))}
    </div>
  );
}
