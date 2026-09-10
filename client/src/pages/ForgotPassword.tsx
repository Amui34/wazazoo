import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField } from "../components/TextField.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { MusicLineArt } from "../components/MusicLineArt.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { forgotPassword } from "../features/auth/api.js";
import { getApiErrorMessage } from "../lib/api.js";

const schema = z.object({ email: z.string().email("Email invalide.") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  useDocumentTitle("Mot de passe oublié");
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-6 py-12 text-white">
      <AmbientLights />
      <MusicLineArt />
      <div className="relative w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>

        {sent ? (
          <div className="mt-8 rounded-md border border-emerald-700 bg-emerald-950/40 p-4 text-sm text-emerald-200">
            <p>
              Si un compte existe avec cet email, on vient d'y envoyer un lien pour choisir un
              nouveau mot de passe. Pense à vérifier tes spams.
            </p>
            <Link to="/connexion" className="mt-3 inline-block underline hover:text-white">
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-400">
              Entre ton email : on t'enverra un lien pour réinitialiser ton mot de passe.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <TextField
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register("email")}
              />
              {serverError && <p className="text-sm text-red-400">{serverError}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-60"
              >
                {isSubmitting ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-neutral-400">
              <Link to="/connexion" className="underline hover:text-white">
                ← Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
