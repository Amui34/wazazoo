import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useInvalidateAuth } from "../features/auth/AuthContext.js";
import { logout } from "../features/auth/api.js";
import { getMyProfile } from "../features/profile/api.js";

const itemCls =
  "block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-200 transition-colors hover:bg-neutral-800";

export function UserMenu() {
  const { user } = useAuth();
  const invalidateAuth = useInvalidateAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Le nom choisi : nom d'artiste si dispo, sinon le début de l'email.
  const { data: profile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: getMyProfile,
    enabled: user?.role === "MUSICIAN",
  });

  const name = user ? profile?.displayName || user.email.split("@")[0] : "";
  const initial = (name || "?").charAt(0).toUpperCase();

  async function handleLogout() {
    setOpen(false);
    await logout();
    await invalidateAuth();
    navigate("/");
  }

  return (
    <div className="relative">
      {user ? (
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full border border-neutral-700 py-1 pl-1 pr-3 transition-colors hover:border-neutral-500"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
            {initial}
          </span>
          <span className="max-w-[120px] truncate text-sm text-neutral-200">{name}</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Compte"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition-colors hover:border-neutral-400 hover:text-white"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
          </svg>
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-neutral-800 bg-neutral-900 p-1 shadow-2xl shadow-black/50">
            {user ? (
              <>
                <div className="px-3 py-2 text-xs text-neutral-500">
                  Connecté en tant que
                  <div className="truncate text-sm text-neutral-300">{name}</div>
                </div>
                <div className="my-1 border-t border-neutral-800" />
                {user.role === "MUSICIAN" && (
                  <Link to="/tableau-de-bord" onClick={() => setOpen(false)} className={itemCls}>
                    Mon espace
                  </Link>
                )}
                {(user.role === "MUSICIAN" || user.role === "RECRUITER") && (
                  <Link to="/messages" onClick={() => setOpen(false)} className={itemCls}>
                    Messages
                  </Link>
                )}
                <Link to="/favoris" onClick={() => setOpen(false)} className={itemCls}>
                  Mes favoris
                </Link>
                {user.role === "ADMIN" && (
                  <Link to="/admin" onClick={() => setOpen(false)} className={itemCls}>
                    Administration
                  </Link>
                )}
                <div className="my-1 border-t border-neutral-800" />
                <button onClick={handleLogout} className={`${itemCls} text-red-300`}>
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link to="/connexion" onClick={() => setOpen(false)} className={itemCls}>
                  Se connecter
                </Link>
                <Link to="/inscription" onClick={() => setOpen(false)} className={`${itemCls} font-medium text-violet-300`}>
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
