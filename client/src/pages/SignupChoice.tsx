import { Link } from "react-router-dom";
import { AmbientLights } from "../components/AmbientLights.js";
import { MusicLineArt } from "../components/MusicLineArt.js";
import { Logo } from "../components/Logo.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

const roles = [
  {
    to: "/inscription/musicien",
    emoji: "🎤",
    title: "Artiste ou groupe",
    text: "Crée ta page, monte sur scène en un tap et sois trouvé par les lieux.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    to: "/inscription/recruteur",
    emoji: "🔎",
    title: "Je cherche un artiste",
    text: "Bar, resto, salle, événement : trouve et contacte des artistes vérifiés.",
    accent: "from-amber-500 to-orange-500",
  },
  {
    to: "/inscription/organisateur",
    emoji: "🎉",
    title: "Organisateur / Club",
    text: "Publie tes soirées sur la carte et booke des artistes (La Bubble, SOHO…).",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    to: "/inscription/festival",
    emoji: "🎪",
    title: "Festival",
    text: "Mets ton festival sur la carte : line-up, dates et scènes, dans sa propre catégorie.",
    accent: "from-rose-500 to-red-500",
  },
  {
    to: "/inscription/lieu",
    emoji: "🍸",
    title: "Lieu / Restaurant",
    text: "Crée la page de ton établissement et publie tes soirées : tu apparais sur la carte quand tu proposes une soirée.",
    accent: "from-teal-500 to-emerald-500",
  },
  {
    to: "/inscription/touriste",
    emoji: "🧭",
    title: "Explorer & suivre",
    text: "Suis tes artistes favoris et sois notifié dès qu'ils montent sur scène près de toi.",
    accent: "from-sky-500 to-emerald-500",
  },
];

export default function SignupChoice() {
  useDocumentTitle("Créer un compte");
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 text-white">
      <AmbientLights />
      <MusicLineArt />
      <div className="relative w-full max-w-2xl">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo size={40} />
        </Link>
        <h1 className="text-center text-2xl font-bold sm:text-3xl">Rejoindre WAZAZOO</h1>
        <p className="mt-2 text-center text-sm text-neutral-400">Qui es-tu ? Choisis pour commencer.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {roles.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-neutral-600"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${r.accent} text-2xl`}
              >
                {r.emoji}
              </div>
              <p className="mt-4 text-lg font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-neutral-400">{r.text}</p>
              <span className="mt-3 inline-block text-sm font-medium text-white group-hover:underline">
                Continuer →
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-neutral-400">
          Juste envie d'explorer&nbsp;?{" "}
          <Link to="/" className="text-white underline hover:text-neutral-200">
            Voir la carte des sorties
          </Link>{" "}
          — aucun compte requis.
        </p>
        <p className="mt-3 text-center text-sm text-neutral-500">
          Déjà inscrit&nbsp;?{" "}
          <Link to="/connexion" className="text-neutral-300 underline hover:text-white">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
