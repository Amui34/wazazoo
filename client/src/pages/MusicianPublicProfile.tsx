import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { Badge } from "../components/Badge.js";
import { StarRating } from "../components/StarRating.js";
import { Reveal } from "../components/Reveal.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { getPublicProfile } from "../features/profile/api.js";
import { sendContactRequest } from "../features/contact-requests/api.js";
import { followArtist, unfollowArtist } from "../features/social/api.js";
import { useAuth } from "../features/auth/AuthContext.js";
import { getApiErrorMessage } from "../lib/api.js";

export default function MusicianPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => getPublicProfile(id!),
    enabled: Boolean(id),
  });

  useDocumentTitle(profile?.displayName ?? "Profil musicien");

  const contactMutation = useMutation({
    mutationFn: () => sendContactRequest({ profileId: id!, message }),
    onSuccess: () => setSent(true),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const followMutation = useMutation({
    mutationFn: () => (profile?.isFollowing ? unfollowArtist(id!) : followArtist(id!)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", id] }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Chargement...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        Profil introuvable.
      </div>
    );
  }

  const cover = profile.media.find((m) => m.isCover) ?? profile.media[0];
  const otherMedia = profile.media.filter((m) => m.id !== cover?.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />

      <div className="relative">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex animate-fade-in-up flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          {cover && (
            <div className="relative shrink-0">
              {profile.certificationsCount > 0 && (
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 animate-glow-pulse rounded-full bg-emerald-500/30 blur-xl"
                />
              )}
              <img
                src={cover.url}
                alt={profile.displayName}
                className="h-32 w-32 rounded-full object-cover shadow-lg shadow-black/40 transition-transform duration-300 hover:scale-105"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{profile.displayName}</h1>
            <p className="mt-1 text-neutral-400">
              {profile.profileType === "DJ"
                ? "DJ"
                : profile.profileType === "ORGANIZER"
                  ? "🎉 Organisateur de soirées"
                  : "Musicien"}{" "}
              · {profile.city}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile.certificationsCount > 0 && (
                <Badge tone="success">✓ {profile.certificationsCount} certification(s)</Badge>
              )}
              {profile.averageRating != null && (
                <span className="inline-flex items-center gap-1 text-sm text-neutral-300">
                  <StarRating value={profile.averageRating} /> {profile.averageRating.toFixed(1)}
                </span>
              )}
              {(profile.rateMin || profile.rateMax) && (
                <Badge>
                  {profile.rateMin ?? "?"}–{profile.rateMax ?? "?"} € / prestation
                </Badge>
              )}
              {profile.ratesVisible === false && profile.profileType !== "ORGANIZER" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-2.5 py-0.5 text-xs text-neutral-400">
                  💼 Tarifs réservés aux recruteurs
                </span>
              )}
            </div>

            <div className="mt-3 flex justify-center sm:justify-start">
              {!user ? (
                <Link
                  to="/connexion"
                  className="rounded-full border border-neutral-700 px-4 py-1.5 text-sm transition-colors hover:border-violet-400 hover:text-violet-200"
                >
                  ❤️ Suivre{profile.followersCount ? ` · ${profile.followersCount}` : ""}
                </Link>
              ) : (
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-50 ${
                    profile.isFollowing
                      ? "border border-violet-400 bg-violet-500/20 text-violet-200"
                      : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:-translate-y-0.5"
                  }`}
                >
                  {profile.isFollowing ? "✓ Suivi" : "❤️ Suivre"}
                  {profile.followersCount ? ` · ${profile.followersCount}` : ""}
                </button>
              )}
            </div>
          </div>
        </div>

        <Reveal delay={80} className="mt-8 flex flex-wrap gap-2">
          {profile.styles.map((s) => (
            <span key={s.id} className="transition-transform duration-200 hover:scale-105">
              <Badge>{s.name}</Badge>
            </span>
          ))}
          {profile.instruments.map((i) => (
            <span key={i.id} className="transition-transform duration-200 hover:scale-105">
              <Badge>{i.name}</Badge>
            </span>
          ))}
        </Reveal>

        {profile.bio && (
          <Reveal delay={120}>
            <p className={`mt-6 whitespace-pre-line text-neutral-300 ${!user ? "line-clamp-3" : ""}`}>
              {profile.bio}
            </p>
          </Reveal>
        )}

        {/* Visiteur non connecté : aperçu limité + invitation à débloquer le reste. */}
        {!user && (
          <Reveal
            delay={140}
            className="mt-8 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/12 to-fuchsia-500/[0.06] p-6 text-center"
          >
            <p className="text-2xl">🔒</p>
            <h2 className="mt-2 text-lg font-semibold">Vois le profil complet de {profile.displayName}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-300">
              Bio complète, médias, avis &amp; certifications, disponibilités et contact — c'est gratuit.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                to="/inscription"
                className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Créer un compte gratuit
              </Link>
              <Link
                to="/connexion"
                className="rounded-full border border-neutral-600 px-5 py-2 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-400"
              >
                Se connecter
              </Link>
            </div>
          </Reveal>
        )}

        {user && (
          <>
        {profile.profileType === "DJ" && profile.equipmentNotes && (
          <Reveal delay={140} className="mt-6">
            <h2 className="font-medium">Matériel / setup</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-neutral-400">{profile.equipmentNotes}</p>
          </Reveal>
        )}

        {profile.availabilities.length > 0 && (
          <Reveal delay={100} className="mt-8">
            <h2 className="font-medium">Prochaines disponibilités</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.availabilities.map((a) => (
                <Badge key={a.id} tone="success">
                  Du {new Date(a.startDate).toLocaleDateString("fr-FR")} au{" "}
                  {new Date(a.endDate).toLocaleDateString("fr-FR")}
                </Badge>
              ))}
            </div>
          </Reveal>
        )}

        {otherMedia.length > 0 && (
          <Reveal className="mt-8">
            <h2 className="font-medium">Médias</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {otherMedia.map((item, i) =>
                item.type === "PHOTO" ? (
                  <img
                    key={item.id}
                    src={item.url}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="aspect-square animate-fade-in-up rounded-md object-cover transition-transform duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-black/40"
                  />
                ) : (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="flex aspect-square animate-fade-in-up items-center justify-center rounded-md border border-neutral-800 p-3 text-center text-sm text-neutral-300 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-500 hover:bg-neutral-900/60"
                  >
                    {item.type === "VIDEO" ? "▶ Vidéo" : item.type === "AUDIO_LINK" ? "♪ Audio" : "🔗 Lien"}
                  </a>
                )
              )}
            </div>
          </Reveal>
        )}

        {profile.certifications.length > 0 && (
          <Reveal className="mt-8">
            <h2 className="font-medium">Certifications & avis</h2>
            <div className="mt-3 space-y-3">
              {profile.certifications.map((cert, i) => (
                <div
                  key={cert.id}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className="animate-fade-in-up rounded-md border border-neutral-800 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-600"
                >
                  <p className="text-sm">
                    <span className="text-white">{cert.venueName}</span>
                    {cert.city && <span className="text-neutral-500"> · {cert.city}</span>}
                  </p>
                  {cert.review && (
                    <>
                      <StarRating value={cert.review.rating} size="text-sm" />
                      {cert.review.comment && (
                        <p className="mt-1 text-sm text-neutral-400">"{cert.review.comment}"</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal className="mt-10 rounded-md border border-neutral-800 p-5 transition-colors duration-300 hover:border-neutral-700">
          {user && ["RECRUITER", "ORGANIZER", "FESTIVAL", "MUSICIAN"].includes(user.role) &&
            (sent ? (
              <p className="animate-fade-in-up text-sm text-emerald-400">
                ✓ Ta demande a été envoyée. {profile.displayName} peut désormais accepter ou refuser.
              </p>
            ) : (
              <div>
                <p className="text-sm text-neutral-300">
                  {profile.profileType === "ORGANIZER"
                    ? "🎉 Contacter pour organiser une soirée"
                    : user.role === "MUSICIAN"
                      ? "🎸 Proposer de jouer ensemble / monter un groupe"
                      : "Envoyer une demande de contact"}
                </p>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    profile.profileType === "ORGANIZER"
                      ? "Ton projet de soirée, la date, le lieu, ce que tu cherches…"
                      : user.role === "MUSICIAN"
                        ? "Présente-toi, ton projet, ton style, ce que tu cherches…"
                        : "Décris ton événement, la date, le lieu..."
                  }
                  className="mt-2 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors duration-200 focus:border-neutral-400"
                />
                {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
                <button
                  onClick={() => contactMutation.mutate()}
                  disabled={message.trim().length < 10 || contactMutation.isPending}
                  className="mt-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-200 disabled:pointer-events-none disabled:opacity-50"
                >
                  {contactMutation.isPending ? "Envoi..." : "Envoyer la demande"}
                </button>
              </div>
            ))}

          {user?.role === "TOURIST" && (
            <p className="text-sm text-neutral-500">
              Passe en compte artiste, organisateur ou recruteur pour contacter les profils.
            </p>
          )}
        </Reveal>
          </>
        )}
      </div>

      <Footer />
      </div>
    </div>
  );
}
