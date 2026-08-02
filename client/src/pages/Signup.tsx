import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField } from "../components/TextField.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { signup } from "../features/auth/api.js";
import { getApiErrorCode, getApiErrorMessage } from "../lib/api.js";

const schema = z
  .object({
    email: z.string().email("Email invalide."),
    password: z
      .string()
      .min(10, "10 caractères minimum.")
      .regex(/[a-z]/, "Au moins une minuscule.")
      .regex(/[A-Z]/, "Au moins une majuscule.")
      .regex(/[0-9]/, "Au moins un chiffre."),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, { message: "Requis pour continuer." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function Signup({
  role,
}: {
  role: "MUSICIAN" | "RECRUITER" | "TOURIST" | "ORGANIZER" | "FESTIVAL";
}) {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const title =
    role === "MUSICIAN"
      ? "Créer mon profil musicien"
      : role === "RECRUITER"
        ? "Créer un compte recruteur"
        : role === "ORGANIZER"
          ? "Créer un compte organisateur"
          : role === "FESTIVAL"
            ? "Créer un compte festival"
            : "Créer mon compte";
  useDocumentTitle(title);
  const subtitle =
    role === "MUSICIAN"
      ? "Pour trouver des lieux qui t'embauchent."
      : role === "RECRUITER"
        ? "Pour trouver des musiciens pour tes événements."
        : role === "ORGANIZER"
          ? "Pour publier tes soirées sur la carte et booker des artistes."
          : role === "FESTIVAL"
            ? "Pour mettre ton festival sur la carte, dans sa propre catégorie."
            : "Pour suivre tes artistes favoris et être notifié de leurs lives.";

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const result = await signup({
        email: values.email,
        password: values.password,
        role,
        acceptedTerms: true,
      });
      navigate("/verification-envoyee", { state: { email: result.user.email } });
    } catch (err) {
      if (getApiErrorCode(err) === "email_taken") {
        setServerError("Un compte existe déjà avec cet email.");
      } else {
        setServerError(getApiErrorMessage(err));
      }
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-6 py-12 text-white">
      <AmbientLights />
      <div className="relative w-full max-w-sm">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>

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
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <TextField
            id="confirmPassword"
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <label className="flex items-start gap-2 text-sm text-neutral-400">
            <input type="checkbox" className="mt-1" {...register("acceptedTerms")} />
            <span>J'accepte les conditions d'utilisation et la politique de confidentialité.</span>
          </label>
          {errors.acceptedTerms && (
            <p className="text-sm text-red-400">{errors.acceptedTerms.message}</p>
          )}

          {serverError && <p className="text-sm text-red-400">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-60"
          >
            {isSubmitting ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Déjà inscrit ?{" "}
          <Link to="/connexion" className="text-white underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
