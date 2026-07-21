import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { StarRating } from "../components/StarRating.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { searchMusicians } from "../features/search/api.js";
import { getStyles } from "../features/profile/api.js";

const THEMES = [
  { glow: "group-hover:shadow-violet-500/30", sleeve: "from-violet-600/70 to-fuchsia-600/50", label: "#a78bfa", chip: "border-violet-400/30 bg-violet-500/15 text-violet-200" },
  { glow: "group-hover:shadow-fuchsia-500/30", sleeve: "from-fuchsia-600/70 to-rose-600/50", label: "#e879f9", chip: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-200" },
  { glow: "group-hover:shadow-sky-500/30", sleeve: "from-sky-600/70 to-violet-600/50", label: "#38bdf8", chip: "border-sky-400/30 bg-sky-500/15 text-sky-200" },
  { glow: "group-hover:shadow-emerald-500/30", sleeve: "from-emerald-600/70 to-sky-600/50", label: "#34d399", chip: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200" },
  { glow: "group-hover:shadow-amber-500/30", sleeve: "from-amber-600/70 to-rose-600/50", label: "#fbbf24", chip: "border-amber-400/30 bg-amber-500/15 text-amber-200" },
];

const STYLE_CHIPS = [
  "border-violet-400/30 bg-violet-500/15 text-violet-200",
  "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-200",
  "border-sky-400/30 bg-sky-500/15 text-sky-200",
  "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  "border-amber-400/30 bg-amber-500/15 text-amber-200",
  "border-rose-400/30 bg-rose-500/15 text-rose-200",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const themeFor = (id: string) => THEMES[hashString(id) % THEMES.length];
const chipFor = (name: string) => STYLE_CHIPS[hashString(name) % STYLE_CHIPS.length];

// Sillons + reflet d'un disque vinyle, avec pastille centrale colorée.
function vinylBackground(label: string) {
  return {
    backgroundImage: `
      radial-gradient(circle at 50% 50%, ${label} 0 15%, #0a0a0a 15% 18%, rgba(0,0,0,0) 18%),
      repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0) 1px 4px),
      radial-gradient(circle at 34% 30%, rgba(255,255,255,0.18), rgba(255,255,255,0) 45%),
      radial-gradient(circle at 50% 50%, #232323, #050505 70%)
    `,
  };
}

function VinylCard({
  musician,
  index,
  fetching,
}: {
  musician: any;
  index: number;
  fetching: boolean;
}) {
  const theme = themeFor(musician.id);
  return (
    <Link
      to={`/musiciens/${musician.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms`, opacity: fetching ? 0.6 : 1 }}
      className="group relative block animate-fade-in-up pr-8 sm:pr-10"
    >
      <div className="relative">
        {/* Le vinyle, glissé derrière la pochette, sort et tourne au survol */}
        <div
          aria-hidden
          style={vinylBackground(theme.label)}
          className="absolute right-0 top-0 aspect-square h-full translate-x-[26%] rounded-full shadow-lg shadow-black/60 ring-1 ring-black/50 transition-transform duration-500 ease-out group-hover:translate-x-[42%] group-hover:rotate-[28deg]"
        />

        {/* La pochette (carré) au premier plan */}
        <div
          className={`relative z-10 aspect-square overflow-hidden rounded-md shadow-2xl shadow-black/50 ring-1 ring-white/10 transition-all duration-500 group-hover:-translate-y-1 ${theme.glow}`}
        >
          {musician.coverPhotoUrl ? (
            <img
              src={musician.coverPhotoUrl}
              alt={musician.displayName}
              className="h-full w-full object-cover object-[center_28%] transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${theme.sleeve}`}>
              <span className="text-6xl font-black text-white/85">{musician.displayName.charAt(0)}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/10 to-transparent" />

          <span
            className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide backdrop-blur ${
              musician.profileType === "DJ"
                ? "border-fuchsia-300/40 bg-fuchsia-500/25 text-fuchsia-50"
                : "border-sky-300/40 bg-sky-500/25 text-sky-50"
            }`}
          >
            {musician.profileType === "DJ" ? "DJ" : "Live"}
          </span>

          <div className="absolute inset-x-3 bottom-2.5">
            <p className="truncate text-lg font-bold leading-tight drop-shadow-lg">{musician.displayName}</p>
            {musician.city && <p className="text-xs text-neutral-300">{musician.city}</p>}
          </div>
        </div>
      </div>

      {/* Infos sous la pochette, comme une étiquette de disque */}
      <div className="relative z-10 mt-3 pr-2">
        <div className="flex flex-wrap gap-1.5">
          {musician.styles.slice(0, 3).map((s: { id: string; name: string }) => (
            <span
              key={s.id}
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${chipFor(s.name)}`}
            >
              {s.name}
            </span>
          ))}
        </div>

        <div className="mt-2.5 flex items-center justify-between text-sm">
          <span className={musician.certificationsCount > 0 ? "text-emerald-400" : "text-neutral-500"}>
            {musician.certificationsCount > 0 ? `✓ ${musician.certificationsCount} certif.` : "Nouveau"}
          </span>
          {musician.averageRating != null && <StarRating value={musician.averageRating} size="text-xs" />}
        </div>

        {(musician.rateMin || musician.rateMax) && (
          <p className="mt-1.5 text-xs font-medium text-amber-300/90">
            {musician.rateMin ?? "?"}–{musician.rateMax ?? "?"} € / prestation
          </p>
        )}
      </div>
    </Link>
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div style={{ animationDelay: `${delay}ms` }} className="animate-fade-in-up pr-8 sm:pr-10">
      <div className="aspect-square animate-pulse rounded-md bg-neutral-800/60" />
      <div className="mt-3 space-y-2">
        <div className="flex gap-1.5">
          <div className="h-5 w-14 animate-pulse rounded-full bg-neutral-800" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-800" />
        </div>
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-800" />
      </div>
    </div>
  );
}

export default function Search() {
  useDocumentTitle("Trouver un musicien");
  const [profileType, setProfileType] = useState<"" | "MUSICIAN" | "DJ">("");
  const [styleId, setStyleId] = useState("");
  const [city, setCity] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [minCertifications, setMinCertifications] = useState("");

  const { data: styles = [] } = useQuery({ queryKey: ["styles"], queryFn: getStyles });

  const { data: results = [], isFetching, isPending } = useQuery({
    queryKey: ["search", "musicians", profileType, styleId, city, budgetMax, minCertifications],
    queryFn: () =>
      searchMusicians({
        profileType: profileType || undefined,
        styleId: styleId || undefined,
        city: city || undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        minCertifications: minCertifications ? Number(minCertifications) : undefined,
      }),
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />

      <div className="relative">
        <Navbar />

        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="animate-fade-in-up text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            La crate ♫
          </p>
          <h1 className="mt-1 animate-fade-in-up bg-gradient-to-r from-white via-violet-200 to-fuchsia-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            Trouver un artiste
          </h1>
          <p className="mt-1 animate-fade-in-up text-sm text-neutral-400" style={{ animationDelay: "20ms" }}>
            Musiciens et DJ vérifiés — parcours les pochettes, survole pour révéler le vinyle.
          </p>

          <div className="mt-6 flex animate-fade-in-up gap-2" style={{ animationDelay: "40ms" }}>
            {(["", "MUSICIAN", "DJ"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setProfileType(t)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-all duration-200 ${
                  profileType === t
                    ? "border-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 font-medium text-white shadow-lg shadow-violet-500/25"
                    : "border-neutral-700 text-neutral-300 hover:border-violet-400/60 hover:text-white"
                }`}
              >
                {t === "" ? "Tous" : t === "MUSICIAN" ? "Musiciens" : "DJ"}
              </button>
            ))}
          </div>

          <div
            className="mt-3 grid animate-fade-in-up grid-cols-2 gap-3 sm:grid-cols-4"
            style={{ animationDelay: "80ms" }}
          >
            <select
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white transition-colors duration-200 focus:border-violet-400"
            >
              <option value="">Tous les styles</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors duration-200 focus:border-violet-400"
            />
            <input
              placeholder="Budget max (€)"
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors duration-200 focus:border-violet-400"
            />
            <input
              placeholder="Certifications min"
              type="number"
              value={minCertifications}
              onChange={(e) => setMinCertifications(e.target.value)}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors duration-200 focus:border-violet-400"
            />
          </div>

          {!isPending && (
            <p
              className="mt-6 animate-fade-in-up text-sm text-neutral-400 transition-opacity duration-300"
              style={{ opacity: isFetching ? 0.5 : 1 }}
            >
              <span className="font-medium text-violet-300">{results.length}</span> artiste
              {results.length !== 1 ? "s" : ""} dans la crate
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {isPending && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} delay={i * 60} />)}

            {!isPending &&
              results.map((musician, i) => (
                <VinylCard key={musician.id} musician={musician} index={i} fetching={isFetching} />
              ))}
          </div>

          {!isPending && !isFetching && results.length === 0 && (
            <div className="mt-16 animate-fade-in-up text-center">
              <p className="text-3xl">🎧</p>
              <p className="mt-3 text-sm text-neutral-500">Aucun artiste ne correspond à ces critères.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
