import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../features/auth/AuthContext.js";
import { getCertificationByToken, confirmCertification, submitReview } from "../features/certifications/api.js";
import { listMyVenues } from "../features/venues/api.js";
import { getApiErrorMessage } from "../lib/api.js";

export default function CertificationConfirm() {
  useDocumentTitle("Confirmation de prestation");
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [venueChoice, setVenueChoice] = useState<"existing" | "new">("new");
  const [venueId, setVenueId] = useState("");
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueCity, setNewVenueCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmedCertId, setConfirmedCertId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);

  const { data: certification, isLoading, refetch } = useQuery({
    queryKey: ["certification", token],
    queryFn: () => getCertificationByToken(token!),
    enabled: Boolean(token),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["venues", "mine"],
    queryFn: listMyVenues,
    enabled: user?.role === "RECRUITER",
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      confirmCertification(
        token!,
        venueChoice === "existing"
          ? { venueId }
          : { newVenue: { name: newVenueName, city: newVenueCity || undefined } }
      ),
    onSuccess: (cert) => {
      setConfirmedCertId(cert.id);
      setError(null);
      refetch();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const reviewMutation = useMutation({
    mutationFn: () => submitReview(confirmedCertId!, { rating, comment: comment || undefined }),
    onSuccess: () => setReviewSent(true),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Chargement...
      </div>
    );
  }

  if (!certification) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        Lien de certification invalide.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />
      <div className="relative">
      <Navbar />
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold">Confirmation de prestation</h1>
        <p className="mt-3 text-neutral-400">
          <span className="text-white">{certification.musicianDisplayName}</span> te demande de confirmer
          qu'il/elle a joué chez <span className="text-white">{certification.claimedVenueName}</span>
          {certification.performanceDate &&
            ` le ${new Date(certification.performanceDate).toLocaleDateString("fr-FR")}`}
          .
        </p>

        {certification.status === "CONFIRMED" && !confirmedCertId && (
          <p className="mt-6 text-emerald-400">Cette prestation a déjà été confirmée.</p>
        )}

        {certification.status === "PENDING" && !user && (
          <p className="mt-6 text-sm text-neutral-400">
            <Link to="/connexion" state={{ from: location.pathname }} className="text-white underline">
              Connecte-toi
            </Link>{" "}
            ou{" "}
            <Link to="/inscription/recruteur" className="text-white underline">
              crée un compte lieu / recruteur
            </Link>{" "}
            pour confirmer.
          </p>
        )}

        {certification.status === "PENDING" && user && user.role !== "RECRUITER" && (
          <p className="mt-6 text-sm text-neutral-400">
            Seul un compte lieu / recruteur peut confirmer une certification.
          </p>
        )}

        {certification.status === "PENDING" && user?.role === "RECRUITER" && !confirmedCertId && (
          <div className="mt-6 space-y-4 text-left">
            {venues.length > 0 && (
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={venueChoice === "existing"}
                    onChange={() => setVenueChoice("existing")}
                  />
                  Un de mes lieux
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" checked={venueChoice === "new"} onChange={() => setVenueChoice("new")} />
                  Nouveau lieu
                </label>
              </div>
            )}

            {venueChoice === "existing" && venues.length > 0 ? (
              <select
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
              >
                <option value="">Choisir un lieu</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  placeholder="Nom du lieu"
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400"
                />
                <input
                  placeholder="Ville"
                  value={newVenueCity}
                  onChange={(e) => setNewVenueCity(e.target.value)}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={() => confirmMutation.mutate()}
              disabled={
                confirmMutation.isPending ||
                (venueChoice === "existing" ? !venueId : newVenueName.trim().length < 2)
              }
              className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
            >
              {confirmMutation.isPending ? "Confirmation..." : "Confirmer la prestation"}
            </button>
          </div>
        )}

        {confirmedCertId && !reviewSent && (
          <div className="mt-6 space-y-3 text-left">
            <p className="text-center text-emerald-400">Prestation confirmée !</p>
            <p className="text-sm text-neutral-300">Laisser un avis (optionnel)</p>
            <div className="flex justify-center gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={n <= rating ? "text-amber-400" : "text-neutral-700"}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ton commentaire..."
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400"
            />
            <button
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
              className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
            >
              Envoyer l'avis
            </button>
          </div>
        )}

        {reviewSent && <p className="mt-6 text-emerald-400">Merci, ton avis a été publié !</p>}
      </div>
      </div>
    </div>
  );
}
