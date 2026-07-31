import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { Badge } from "../components/Badge.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../features/auth/AuthContext.js";
import { getMyProfile } from "../features/profile/api.js";
import { getMyDjProfile } from "../features/dj/api.js";
import {
  listReceivedContactRequests,
  acceptContactRequest,
  declineContactRequest,
} from "../features/contact-requests/api.js";
import {
  listMyCertifications,
  createCertification,
} from "../features/certifications/api.js";
import {
  listMyAvailabilities,
  addAvailability,
  removeAvailability,
} from "../features/profile/api.js";
import { getApiErrorMessage } from "../lib/api.js";
import { OnStageButton } from "../components/OnStageButton.js";

const statusLabel: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  DECLINED: "Refusée",
  CONFIRMED: "Confirmée",
  EXPIRED: "Expirée",
};

export default function Dashboard() {
  useDocumentTitle("Tableau de bord");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [claimedVenueName, setClaimedVenueName] = useState("");
  const [performanceDate, setPerformanceDate] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availStart, setAvailStart] = useState("");
  const [availEnd, setAvailEnd] = useState("");

  const { data: profile } = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
  const { data: djProfile } = useQuery({ queryKey: ["dj-profile", "me"], queryFn: getMyDjProfile });
  const { data: contactRequests = [] } = useQuery({
    queryKey: ["contact-requests", "received"],
    queryFn: listReceivedContactRequests,
  });
  const { data: certifications = [] } = useQuery({
    queryKey: ["certifications", "mine"],
    queryFn: listMyCertifications,
  });
  const { data: availabilities = [] } = useQuery({
    queryKey: ["availabilities", "mine"],
    queryFn: listMyAvailabilities,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptContactRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact-requests", "received"] }),
  });
  const declineMutation = useMutation({
    mutationFn: declineContactRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact-requests", "received"] }),
  });

  const createCertMutation = useMutation({
    mutationFn: () => createCertification({ claimedVenueName, performanceDate: performanceDate || undefined }),
    onSuccess: () => {
      setClaimedVenueName("");
      setPerformanceDate("");
      queryClient.invalidateQueries({ queryKey: ["certifications", "mine"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const addAvailabilityMutation = useMutation({
    mutationFn: () => addAvailability({ startDate: availStart, endDate: availEnd, isAvailable: true }),
    onSuccess: () => {
      setAvailStart("");
      setAvailEnd("");
      queryClient.invalidateQueries({ queryKey: ["availabilities", "mine"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const removeAvailabilityMutation = useMutation({
    mutationFn: removeAvailability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availabilities", "mine"] }),
  });

  function copyLink(token: string, id: string) {
    const url = `${window.location.origin}/certifier/${token}`;
    navigator.clipboard.writeText(url).catch(() => undefined);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const hasProfile = profile && profile.displayName;
  const hasDjProfile = djProfile && djProfile.displayName;
  const pendingRequests = contactRequests.filter((r) => r.status === "PENDING");

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />

      <div className="relative">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-neutral-400">Connecté en tant que {user?.email}</p>

        {(hasProfile || hasDjProfile) && <OnStageButton />}

        <section className="mt-8 rounded-lg border border-neutral-800 p-5">
          {hasProfile && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{profile.displayName}</p>
                <Badge tone={profile.status === "PUBLISHED" ? "success" : "neutral"}>
                  Musicien · {profile.status === "PUBLISHED" ? "Profil publié" : "Brouillon (non visible)"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.status === "PUBLISHED" && (
                  <Link
                    to={`/musiciens/${profile.id}`}
                    className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500"
                  >
                    Voir mon profil public
                  </Link>
                )}
                <Link
                  to="/profil/editer"
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
                >
                  Modifier
                </Link>
              </div>
            </div>
          )}

          {hasDjProfile && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{djProfile.displayName}</p>
                <Badge tone={djProfile.status === "PUBLISHED" ? "success" : "neutral"}>
                  DJ · {djProfile.status === "PUBLISHED" ? "Profil publié" : "Brouillon (non visible)"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {djProfile.status === "PUBLISHED" && (
                  <Link
                    to={`/musiciens/${djProfile.id}`}
                    className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500"
                  >
                    Voir mon profil public
                  </Link>
                )}
                <Link
                  to="/profil/dj/editer"
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
                >
                  Modifier
                </Link>
              </div>
            </div>
          )}

          {!hasProfile && !hasDjProfile && (
            <div className="text-center">
              <p className="text-neutral-400">Tu n'as pas encore de profil.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Link
                  to="/profil/editer"
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
                >
                  Créer mon profil musicien
                </Link>
                <Link
                  to="/profil/dj/editer"
                  className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500"
                >
                  Créer mon profil DJ
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-medium">
            Demandes de contact {pendingRequests.length > 0 && `(${pendingRequests.length} en attente)`}
          </h2>
          <div className="mt-3 space-y-3">
            {contactRequests.length === 0 && (
              <p className="text-sm text-neutral-500">Aucune demande reçue pour l'instant.</p>
            )}
            {contactRequests.map((request) => (
              <div key={request.id} className="rounded-md border border-neutral-800 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-300">{request.recruiter.email}</p>
                  <Badge tone={request.status === "ACCEPTED" ? "success" : "neutral"}>
                    {statusLabel[request.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-neutral-400">{request.message}</p>
                {request.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => acceptMutation.mutate(request.id)}
                      className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => declineMutation.mutate(request.id)}
                      className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm hover:border-neutral-500"
                    >
                      Refuser
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-medium">Certifications</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Invite un lieu où tu as joué à confirmer ta prestation — le badge n'apparaît qu'une fois confirmé par
            le lieu.
          </p>

          <div className="mt-3 rounded-md border border-neutral-800 p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                placeholder="Nom du lieu"
                value={claimedVenueName}
                onChange={(e) => setClaimedVenueName(e.target.value)}
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400"
              />
              <input
                type="date"
                value={performanceDate}
                onChange={(e) => setPerformanceDate(e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400"
              />
              <button
                onClick={() => createCertMutation.mutate()}
                disabled={claimedVenueName.trim().length < 2 || createCertMutation.isPending}
                className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
              >
                Générer le lien
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <div className="mt-3 space-y-2">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3"
              >
                <div>
                  <p className="text-sm">{cert.venue?.name ?? cert.claimedVenueName}</p>
                  <Badge tone={cert.status === "CONFIRMED" ? "success" : "neutral"}>
                    {statusLabel[cert.status]}
                  </Badge>
                </div>
                {cert.status === "PENDING" && (
                  <button
                    onClick={() => copyLink(cert.inviteToken, cert.id)}
                    className="text-sm text-neutral-300 underline hover:text-white"
                  >
                    {copiedId === cert.id ? "Copié !" : "Copier le lien d'invitation"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-medium">Disponibilités</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Indique tes prochaines périodes disponibles, visibles sur ton profil public.
          </p>

          <div className="mt-3 rounded-md border border-neutral-800 p-4">
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={availStart}
                onChange={(e) => setAvailStart(e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400"
              />
              <input
                type="date"
                value={availEnd}
                onChange={(e) => setAvailEnd(e.target.value)}
                className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400"
              />
              <button
                onClick={() => addAvailabilityMutation.mutate()}
                disabled={!availStart || !availEnd || addAvailabilityMutation.isPending}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {availabilities.length === 0 && (
              <p className="text-sm text-neutral-500">Aucune disponibilité renseignée.</p>
            )}
            {availabilities.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3"
              >
                <p className="text-sm">
                  Du {new Date(a.startDate).toLocaleDateString("fr-FR")} au{" "}
                  {new Date(a.endDate).toLocaleDateString("fr-FR")}
                </p>
                <button
                  onClick={() => removeAvailabilityMutation.mutate(a.id)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
