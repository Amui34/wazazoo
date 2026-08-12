import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../features/auth/api.js";
import { getApiErrorMessage } from "../lib/api.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { MusicLineArt } from "../components/MusicLineArt.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

type Status = "loading" | "success" | "error";

export default function VerifyEmail() {
  useDocumentTitle("Vérification email");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Lien de vérification incomplet.");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(getApiErrorMessage(err));
      });
  }, [token]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 text-center text-white">
      <AmbientLights />
      <MusicLineArt />
      <div className="relative flex flex-col items-center">
        {status === "loading" && <p className="text-neutral-400">Vérification en cours...</p>}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-semibold">Email vérifié</h1>
            <p className="mt-3 text-neutral-400">Ton compte est activé, tu peux te connecter.</p>
            <Link
              to="/connexion"
              className="mt-6 rounded-md bg-white px-6 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
            >
              Se connecter
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-semibold">Lien invalide</h1>
            <p className="mt-3 text-neutral-400">{error}</p>
            <Link to="/connexion" className="mt-6 text-sm text-neutral-300 underline hover:text-white">
              Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
