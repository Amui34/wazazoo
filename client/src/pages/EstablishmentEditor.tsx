import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { TextField } from "../components/TextField.js";
import { TextArea } from "../components/TextArea.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../features/auth/AuthContext.js";
import {
  getMyProfile,
  updateMyProfile,
  publishMyProfile,
  addMedia,
  removeMedia,
  uploadPhoto,
} from "../features/profile/api.js";
import { getApiErrorMessage } from "../lib/api.js";

// Éditeur de fiche pour les établissements : lieux / restaurants (VENUE) et
// organisateurs (ORGANIZER). Pas de tarif, styles ni instruments : on présente
// l'établissement (nom, ville, présentation, horaires, photos).
export default function EstablishmentEditor() {
  const { user } = useAuth();
  const isVenue = user?.role === "VENUE";
  useDocumentTitle(isVenue ? "Ma page — Lieu / Restaurant" : "Ma page — Organisateur");
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });

  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setCity(profile.city ?? "");
    setBio(profile.bio ?? "");
    setOpeningHours(profile.openingHours ?? "");
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        city: city.trim(),
        openingHours: isVenue ? openingHours.trim() : undefined,
        mobilityRadiusKm: null,
        rateMin: null,
        rateMax: null,
        styleIds: [],
        instrumentIds: [],
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile", "me"], updated);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadPhoto(file);
      return addMedia({ type: "PHOTO", provider: "UPLOAD", url, isCover: profile?.media.length === 0 });
    },
    onSuccess: (updated) => queryClient.setQueryData(["profile", "me"], updated),
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const removeMediaMutation = useMutation({
    mutationFn: (mediaId: string) => removeMedia(mediaId),
    onSuccess: (updated) => queryClient.setQueryData(["profile", "me"], updated),
  });

  const publishMutation = useMutation({
    mutationFn: publishMyProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile", "me"], updated);
      setError(null);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  // Seuls les établissements (lieu / organisateur) éditent leur fiche ici ;
  // les musiciens ont leur propre éditeur.
  if (user && user.role !== "VENUE" && user.role !== "ORGANIZER") {
    return <Navigate to="/" replace />;
  }

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Chargement...
      </div>
    );
  }

  const published = profile.status === "PUBLISHED";
  const canSave = displayName.trim().length >= 2;

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />
      <div className="relative">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">
              {isVenue ? "🍸 Ma page — Lieu / Restaurant" : "🎉 Ma page — Organisateur"}
            </h1>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                published
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-neutral-700 text-neutral-400"
              }`}
            >
              {published ? "En ligne" : "Brouillon"}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            {isVenue
              ? "Présente ton établissement : les gens te trouvent et te contactent, et tu apparais sur la carte quand tu publies une soirée."
              : "Présente-toi : les artistes te trouvent et te contactent pour organiser des soirées."}
          </p>

          {published && (
            <Link
              to={`/musiciens/${profile.id}`}
              className="mt-3 inline-block text-sm font-medium text-violet-300 hover:underline"
            >
              Voir ma page publique →
            </Link>
          )}

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-8 space-y-4">
            <TextField
              id="displayName"
              label={isVenue ? "Nom de l'établissement" : "Nom affiché"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <TextField
              id="city"
              label="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <TextArea
              id="bio"
              label="Présentation"
              placeholder={
                isVenue
                  ? "Ambiance, cuisine, type de scène, ce que tu proposes aux artistes…"
                  : "Ton collectif, tes soirées, ce que tu recherches…"
              }
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            {isVenue && (
              <TextField
                id="openingHours"
                label="Horaires d'ouverture"
                placeholder="Ex. Jeu–Sam 19h–2h · concerts dès 21h"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
              />
            )}

            {/* Photos de l'établissement */}
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-300">Photos</p>
              {profile.media.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {profile.media
                    .filter((m) => m.type === "PHOTO")
                    .map((item) => (
                      <div
                        key={item.id}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-800"
                      >
                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                        <button
                          onClick={() => removeMediaMutation.mutate(item.id)}
                          className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          ✕
                        </button>
                        {item.isCover && (
                          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                            couverture
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhotoMutation.mutate(file);
                  e.target.value = "";
                }}
                disabled={uploadPhotoMutation.isPending}
                className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-950 hover:file:bg-neutral-200"
              />
              <p className="mt-1 text-xs text-neutral-500">
                {uploadPhotoMutation.isPending ? "Envoi en cours…" : "JPEG, PNG, WEBP ou GIF, 8 Mo max."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !canSave}
                className="flex-1 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
              >
                {saveMutation.isPending ? "Enregistrement…" : saved ? "✓ Enregistré" : "Enregistrer"}
              </button>
              {!published && (
                <button
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending || !bio.trim() || !city.trim()}
                  className="flex-1 rounded-md border border-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                >
                  {publishMutation.isPending ? "Publication…" : "Publier ma page"}
                </button>
              )}
            </div>
            {!published && (
              <p className="text-xs text-neutral-500">
                Pour publier : renseigne au moins le nom, la ville et une présentation.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
