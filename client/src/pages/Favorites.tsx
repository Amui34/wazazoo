import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { listFavorites } from "../features/social/api.js";

export default function Favorites() {
  useDocumentTitle("Mes favoris");
  const { data: favorites = [], isPending } = useQuery({
    queryKey: ["favorites"],
    queryFn: listFavorites,
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />
      <div className="relative">
        <Navbar />
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-2xl font-semibold">❤️ Mes artistes suivis</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Tu es notifié dès qu'un de ces artistes monte sur scène.
          </p>

          {!isPending && favorites.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-3xl">🎧</p>
              <p className="mt-3 text-sm text-neutral-500">
                Tu ne suis encore personne.{" "}
                <Link to="/recherche" className="text-violet-300 underline">
                  Découvre des artistes
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {favorites.map((a) => (
                <Link
                  key={a.id}
                  to={`/musiciens/${a.id}`}
                  className="group overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/40 transition-all hover:-translate-y-1 hover:border-violet-400/60"
                >
                  <div className="aspect-square overflow-hidden bg-neutral-800">
                    {a.coverPhotoUrl ? (
                      <img
                        src={a.coverPhotoUrl}
                        alt={a.displayName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600/60 to-fuchsia-600/40 text-4xl font-black text-white/80">
                        {a.displayName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{a.displayName}</p>
                    <p className="text-xs text-neutral-500">
                      {a.profileType === "DJ" ? "DJ" : "Musicien"}
                      {a.city ? ` · ${a.city}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
