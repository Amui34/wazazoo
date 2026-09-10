import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField } from "../components/TextField.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { MusicLineArt } from "../components/MusicLineArt.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { login, resendVerification } from "../features/auth/api.js";
import { useInvalidateAuth } from "../features/auth/AuthContext.js";
import { getApiErrorCode, getApiErrorMessage } from "../lib/api.js";

const schema = z.object({
  email: z.string().email("Email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  useDocumentTitle("Connexion");
  const navigate = useNavigate();
  const location = useLocation();
  const invalidateAuth = useInvalidateAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setNeedsVerification(null);
    setResent(false);
    try {
      const result = await login(values);
      await invalidateAuth();
      const from = (location.state as { from?: string } | null)?.from;
      if (from) {
        navigate(from, { replace: true });
      } else if (result.user.role === "MUSICIAN") {
        navigate("/tableau-de-bord", { replace: true });
      } else {
        navigate("/recherche", { replace: true });
      }
    } catch (err) {
      if (getApiErrorCode(err) === "email_not_verified") {
        setNeedsVerification(values.email);
      } else {
        setServerError(getApiErrorMessage(err));
      }
    }
  }

  async function handleResend() {
    if (!needsVerification) return;
    await resendVerification(needsVerification);
    setResent(true);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-6 py-12 text-white">
      <AmbientLights />
      <MusicLineArt />
      <div className="relative w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Connexion</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <TextField
            id="password"
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          {needsVerification && (
            <div className="rounded-md border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-200">
              <p>Merci de vérifier ton email avant de te connecter.</p>
              <button
                type="button"
                onClick={handleResend}
                className="mt-2 underline hover:text-white"
              >
                {resent ? "Email renvoyé" : "Renvoyer l'email de vérification"}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-60"
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/mot-de-passe-oublie" className="text-neutral-400 underline hover:text-white">
            Mot de passe oublié ?
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-neutral-400">
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="text-white underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
