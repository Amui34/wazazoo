import { Link, useNavigate } from "react-router-dom";
import { useAuth, useInvalidateAuth } from "../features/auth/AuthContext.js";
import { logout } from "../features/auth/api.js";

export function Navbar() {
  const { user } = useAuth();
  const invalidateAuth = useInvalidateAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    await invalidateAuth();
    navigate("/");
  }

  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-lg font-semibold text-white transition-opacity duration-200 hover:opacity-80"
        >
          WAZA
        </Link>
        <nav className="flex items-center gap-3">
          {!user && (
            <>
              <Link
                to="/connexion"
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Connexion
              </Link>
              <Link
                to="/inscription/musicien"
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-200"
              >
                S'inscrire
              </Link>
            </>
          )}

          {user?.role === "MUSICIAN" && (
            <>
              <Link
                to="/tableau-de-bord"
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Tableau de bord
              </Link>
              <Link
                to="/carte"
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Carte
              </Link>
              <Link
                to="/messages"
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Messages
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Déconnexion
              </button>
            </>
          )}

          {user?.role === "RECRUITER" && (
            <>
              <Link
                to="/recherche"
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Recherche
              </Link>
              <Link
                to="/carte"
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Carte
              </Link>
              <Link
                to="/messages"
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Messages
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Déconnexion
              </button>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link
                to="/admin"
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Administration
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-neutral-300 transition-colors duration-200 hover:text-white"
              >
                Déconnexion
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
