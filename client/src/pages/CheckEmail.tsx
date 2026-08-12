import { Link, useLocation } from "react-router-dom";
import { AmbientLights } from "../components/AmbientLights.js";
import { MusicLineArt } from "../components/MusicLineArt.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function CheckEmail() {
  useDocumentTitle("Vérifie ta boîte mail");
  const location = useLocation();
  const state = location.state as { email?: string } | null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 text-center text-white">
      <AmbientLights />
      <MusicLineArt />
      <div className="relative flex flex-col items-center">
        <h1 className="text-2xl font-semibold">Vérifie ta boîte mail</h1>
        <p className="mt-3 max-w-sm text-neutral-400">
          Un email de vérification a été envoyé
          {state?.email ? <> à <span className="text-white">{state.email}</span></> : ""}. Clique sur
          le lien qu'il contient pour activer ton compte.
        </p>

        <Link to="/connexion" className="mt-6 text-sm text-neutral-300 underline hover:text-white">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
