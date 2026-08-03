import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { TextField } from "../components/TextField.js";
import { TextArea } from "../components/TextArea.js";
import { ChipMultiSelect } from "../components/ChipMultiSelect.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  getMyProfile,
  updateMyProfile,
  publishMyProfile,
  addMedia,
  removeMedia,
  uploadPhoto,
  getStyles,
  getInstruments,
} from "../features/profile/api.js";
import { getApiErrorMessage } from "../lib/api.js";

type BaseInfo = {
  displayName: string;
  bio: string;
  city: string;
  mobilityRadiusKm: string;
  rateMin: string;
  rateMax: string;
};

const STEPS = ["Infos de base", "Styles & instruments", "Médias & liens", "Publication"];

export default function ProfileEditor() {
  useDocumentTitle("Mon profil musicien");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
  const { data: styles = [] } = useQuery({ queryKey: ["styles"], queryFn: getStyles });
  const { data: instruments = [] } = useQuery({ queryKey: ["instruments"], queryFn: getInstruments });

  const [base, setBase] = useState<BaseInfo>({
    displayName: "",
    bio: "",
    city: "",
    mobilityRadiusKm: "",
    rateMin: "",
    rateMax: "",
  });
  const [styleIds, setStyleIds] = useState<string[]>([]);
  const [instrumentIds, setInstrumentIds] = useState<string[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"VIDEO" | "AUDIO_LINK" | "EXTERNAL_LINK">("VIDEO");

  useEffect(() => {
    if (!profile) return;
    setBase({
      displayName: profile.displayName,
      bio: profile.bio ?? "",
      city: profile.city ?? "",
      mobilityRadiusKm: profile.mobilityRadiusKm?.toString() ?? "",
      rateMin: profile.rateMin?.toString() ?? "",
      rateMax: profile.rateMax?.toString() ?? "",
    });
    setStyleIds(profile.styles.map((s) => s.id));
    setInstrumentIds(profile.instruments.map((i) => i.id));
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        displayName: base.displayName,
        bio: base.bio,
        city: base.city,
        mobilityRadiusKm: base.mobilityRadiusKm ? Number(base.mobilityRadiusKm) : null,
        rateMin: base.rateMin ? Number(base.rateMin) : null,
        rateMax: base.rateMax ? Number(base.rateMax) : null,
        styleIds,
        instrumentIds,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile", "me"], updated);
      setError(null);
      setStep((s) => s + 1);
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const addMediaMutation = useMutation({
    mutationFn: () => addMedia({ type: mediaType, url: mediaUrl, isCover: profile?.media.length === 0 }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile", "me"], updated);
      setMediaUrl("");
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
      navigate("/tableau-de-bord");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  if (isLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Chargement...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />
      <div className="relative">
      <Navbar />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  i <= step ? "bg-white text-neutral-950" : "border border-neutral-700 text-neutral-500"
                }`}
              >
                {i + 1}
              </span>
              <span className={`hidden sm:inline ${i <= step ? "text-white" : "text-neutral-500"}`}>{label}</span>
              {i < STEPS.length - 1 && <span className="mx-1 text-neutral-700">—</span>}
            </div>
          ))}
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        {step === 0 && (
          <div className="space-y-4">
            <TextField
              id="displayName"
              label="Nom de scène / nom affiché"
              value={base.displayName}
              onChange={(e) => setBase({ ...base, displayName: e.target.value })}
            />
            <TextArea
              id="bio"
              label="Bio / présentation"
              placeholder="Raconte ton parcours, ton univers musical, ton expérience..."
              value={base.bio}
              onChange={(e) => setBase({ ...base, bio: e.target.value })}
            />
            <TextField
              id="city"
              label="Ville"
              value={base.city}
              onChange={(e) => setBase({ ...base, city: e.target.value })}
            />
            <TextField
              id="mobilityRadiusKm"
              label="Rayon de mobilité (km)"
              type="number"
              value={base.mobilityRadiusKm}
              onChange={(e) => setBase({ ...base, mobilityRadiusKm: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="rateMin"
                label="Tarif min (€)"
                type="number"
                value={base.rateMin}
                onChange={(e) => setBase({ ...base, rateMin: e.target.value })}
              />
              <TextField
                id="rateMax"
                label="Tarif max (€)"
                type="number"
                value={base.rateMax}
                onChange={(e) => setBase({ ...base, rateMax: e.target.value })}
              />
            </div>
            <button
              onClick={() => setStep(1)}
              disabled={!base.displayName || !base.bio || !base.city}
              className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <ChipMultiSelect
              label="Styles musicaux"
              options={styles}
              selectedIds={styleIds}
              onChange={setStyleIds}
            />
            <ChipMultiSelect
              label="Instruments"
              options={instruments}
              selectedIds={instrumentIds}
              onChange={setInstrumentIds}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="w-full rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500"
              >
                Précédent
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-60"
              >
                {saveMutation.isPending ? "Enregistrement..." : "Enregistrer et continuer"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-3">
              {profile.media.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500">
                      {item.type} {item.isCover && "· photo de couverture"}
                    </p>
                    <p className="truncate text-sm">{item.url}</p>
                  </div>
                  <button
                    onClick={() => removeMediaMutation.mutate(item.id)}
                    className="ml-3 shrink-0 text-sm text-red-400 hover:text-red-300"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-neutral-800 p-4">
              <p className="text-sm text-neutral-300">Ajouter une photo</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhotoMutation.mutate(file);
                  e.target.value = "";
                }}
                disabled={uploadPhotoMutation.isPending}
                className="mt-2 block w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-neutral-950 hover:file:bg-neutral-200"
              />
              {uploadPhotoMutation.isPending && (
                <p className="mt-2 text-xs text-neutral-500">Envoi en cours...</p>
              )}
              <p className="mt-1 text-xs text-neutral-500">JPEG, PNG, WEBP ou GIF, 8 Mo max.</p>
            </div>

            <div className="rounded-md border border-neutral-800 p-4">
              <p className="text-sm text-neutral-300">Ou ajouter un lien (vidéo, Spotify, YouTube...)</p>
              <div className="mt-3 flex gap-2">
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as typeof mediaType)}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-2 text-sm text-white"
                >
                  <option value="VIDEO">Vidéo</option>
                  <option value="AUDIO_LINK">Extrait audio</option>
                  <option value="EXTERNAL_LINK">Lien (Spotify, YouTube...)</option>
                </select>
                <input
                  type="url"
                  placeholder="https://..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-400"
                />
                <button
                  onClick={() => addMediaMutation.mutate()}
                  disabled={!mediaUrl || addMediaMutation.isPending}
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-full rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500"
              >
                Précédent
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-md border border-neutral-800 p-4">
              <h2 className="font-medium">{base.displayName}</h2>
              <p className="mt-1 text-sm text-neutral-400">{base.bio}</p>
              <p className="mt-2 text-sm text-neutral-500">{base.city}</p>
            </div>

            <label className="flex items-start gap-2 text-sm text-neutral-400">
              <input type="checkbox" id="consent" className="mt-1" />
              <span>
                J'accepte que mon profil soit visible publiquement sur WAZAZOO (nom, bio, styles, médias,
                certifications).
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="w-full rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500"
              >
                Précédent
              </button>
              <button
                onClick={() => {
                  const checkbox = document.getElementById("consent") as HTMLInputElement;
                  if (!checkbox.checked) {
                    setError("Merci d'accepter la visibilité publique de ton profil.");
                    return;
                  }
                  publishMutation.mutate();
                }}
                disabled={publishMutation.isPending}
                className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-200 disabled:opacity-60"
              >
                {publishMutation.isPending ? "Publication..." : "Publier mon profil"}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
