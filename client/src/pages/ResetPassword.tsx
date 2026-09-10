import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField } from "../components/TextField.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { MusicLineArt } from "../components/MusicLineArt.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { resetPassword } from "../features/auth/api.js";
import { getApiErrorMessage } from "../lib/api.js";

// Mêmes règles que le serveur (auth.schema passwordSchema).
const schema = z
  .object({
    password: z
      .string()
      .min(10, "Au moins 10 caractères.")
      .regex(/[a-z]/, "Au moins une minuscule.")
      .regex(/[A-Z]/, "Au moins une majuscule.")
      .regex(/[0-9]/, "Au moins un chiffre."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  useDocumentTitle("Nouveau mot de passe");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await resetPassword(token, values.password);
      setDone(true);
      setTimeout(() => navigate("/connexion", { replace: true }), 1800);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-6 py-12 text-white">
      <AmbientLights />
      <MusicLineArt />
      <div className="relative w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Nouveau mot de passe</h1>

        {!token ? (
          <div className="mt-8 rounded-md border border-red-700 bg-red-950/40 p-4 text-sm text-red-200">
            <p>Lien invalide : il manque le jeton de réinitialisation.</p>
            <Link to="/mot-de-passe-oublie" className="mt-3 inline-block underline hover:text-white">
              Refaire une demande
            </Link>
          </div>
        ) : done ? (
          <div className="mt-8 rounded-md border border-emerald-700 bg-emerald-950/40 p-4 text-sm text-emerald-200">
            <p>Mot de passe mis à jour ✓ Redirection vers la connexion…</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-neutral-400">Choisis un nouveau mot de passe.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <TextField
                id="password"
                label="Nouveau mot de passe"
                type="password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
              />
              <TextField
                id="confirm"
                label="Confirme le mot de passe"
                type="password"
                autoComplete="new-password"
                error={errors.confirm?.message}
                {...register("confirm")}
              />
              {serverError && <p className="text-sm text-red-400">{serverError}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-60"
              >
                {isSubmitting ? "Enregistrement..." : "Réinitialiser"}
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
