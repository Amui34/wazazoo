import { Link } from "react-router-dom";
import { AmbientLights } from "../components/AmbientLights.js";
import { MusicLineArt } from "../components/MusicLineArt.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function NotFound() {
  useDocumentTitle("Page introuvable");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 text-center text-white">
      <AmbientLights />
      <MusicLineArt />
      <div className="relative">
        <p className="text-6xl font-semibold text-neutral-700">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-neutral-400">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-white px-6 py-2 text-sm font-medium text-neutral-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-200"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
