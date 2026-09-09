import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navbar } from "../components/Navbar.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../features/auth/AuthContext.js";
import { listActiveEvents, createEvent, deleteEvent, listMyEvents, type WazaEvent } from "../features/events/api.js";
import { listVenueListings, claimListing, type Bbox } from "../features/venue-listings/api.js";
import { useAutoEndLiveOnMove } from "../features/events/useAutoEndLiveOnMove.js";
import { getApiErrorMessage } from "../lib/api.js";

// ---- Helpers carte ----------------------------------------------------------
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 12 });
    }
  }, [points, map]);
  return null;
}

function FlyTo({ target }: { target: { lat: number; lng: number; zoom?: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], target.zoom ?? 13, { duration: 0.8 });
  }, [target, map]);
  return null;
}

function ClickToPlace({ active, onPlace }: { active: boolean; onPlace: (ll: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      if (active) onPlace({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}


// Catégories affichées, déduites automatiquement du type d'événement + du profil :
//  - Festival (compte FESTIVAL) → Festival
//  - Lieu / organisateur (VENUE, ORGANIZER) → Lieux
//  - Artiste DJ → DJ ; artiste musicien/groupe → Live
type Category = "DJ" | "LIVE" | "FESTIVAL" | "LIEUX";
// Couleurs alignées sur la palette de marque (yeux du logo : turquoise & jaune,
// tête rose) — accents pop sur le thème sombre.
const CAT_META: Record<Category, { color: string; emoji: string; label: string }> = {
  DJ: { color: "#21D0C3", emoji: "🎧", label: "DJ" },
  LIVE: { color: "#8b5cf6", emoji: "🎵", label: "Live" },
  FESTIVAL: { color: "#FF3D82", emoji: "🎪", label: "Festival" },
  // Soirées organisées par un club / lieu / organisateur : ce sont des
  // événements → point coloré bien visible (à ne pas confondre avec les
  // « vrais lieux » gris et discrets du fond de carte).
  LIEUX: { color: "#FFCE2E", emoji: "🎉", label: "Soirée" },
};
function eventCategory(e: WazaEvent): Category {
  if (e.kind === "FESTIVAL") return "FESTIVAL";
  if (e.kind === "VENUE" || e.kind === "ORGANIZER") return "LIEUX";
  if (e.kind === "ARTIST" && e.profileType === "DJ") return "DJ";
  return "LIVE";
}

function pin(cat: Category | "NEW") {
  const bg = cat === "NEW" ? "#22c55e" : CAT_META[cat].color;
  const emoji = cat === "NEW" ? "📍" : CAT_META[cat].emoji;
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};border:2.5px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:16px">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
  });
}

// ---- Lieux réels (OpenStreetMap) --------------------------------------------
// Affichés « de base » façon Google, mais seulement en zoom rapproché pour ne
// pas surcharger. Un lieu revendiqué (géré par l'établissement) est mis en avant.
const LISTING_MIN_ZOOM = 15;
const LISTING_META: Record<string, { emoji: string; label: string }> = {
  bar: { emoji: "🍸", label: "Bar" },
  pub: { emoji: "🍺", label: "Pub" },
  nightclub: { emoji: "🎶", label: "Club" },
  biergarten: { emoji: "🍺", label: "Biergarten" },
  cafe: { emoji: "☕", label: "Café" },
  restaurant: { emoji: "🍴", label: "Restaurant" },
};
const listingMeta = (c: string) => LISTING_META[c] ?? { emoji: "📍", label: "Lieu" };

function listingIcon(category: string, claimed: boolean) {
  const m = listingMeta(category);
  if (claimed) {
    return L.divIcon({
      className: "",
      html: `<div style="width:26px;height:26px;border-radius:50%;background:#fff;border:2px solid #7c5cf0;box-shadow:0 2px 8px rgba(124,92,240,.55);display:flex;align-items:center;justify-content:center;font-size:14px">${m.emoji}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13],
    });
  }
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.85);border:1px solid rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:10px;opacity:.9">${m.emoji}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

// Remonte le zoom + l'emprise visible (pour charger les lieux réels de la zone).
function BoundsWatch({ onChange }: { onChange: (zoom: number, bbox: Bbox) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      onChange(map.getZoom(), {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      });
    },
  });
  return null;
}

// ---- Helpers date/heure -----------------------------------------------------
const pad = (n: number) => String(n).padStart(2, "0");
const timeStr = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function whenLabel(startsAt: string, endsAt: string) {
  const now = Date.now();
  const s = new Date(startsAt).getTime();
  const e = new Date(endsAt).getTime();
  if (s <= now && e > now) return { text: "en ce moment", live: true };
  if (s > now) {
    const min = Math.round((s - now) / 60000);
    if (min < 60) return { text: `dans ${min} min`, live: false };
    if (min < 24 * 60) return { text: `dans ${Math.round(min / 60)} h`, live: false };
    return {
      text: new Date(startsAt).toLocaleDateString("fr-FR", { weekday: "long" }),
      live: false,
    };
  }
  return { text: "terminé", live: false };
}

// Filtre temps réel — le cœur du « qu'est-ce que je fais MAINTENANT autour de moi ».
type TimeFilter = "" | "now" | "tonight" | "weekend";
function matchesTimeFilter(startsAt: string, endsAt: string, tf: TimeFilter): boolean {
  if (!tf) return true;
  const now = Date.now();
  const s = new Date(startsAt).getTime();
  const e = new Date(endsAt).getTime();
  if (e <= now) return false; // déjà terminé
  if (tf === "now") return s <= now;
  if (tf === "tonight") {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return s <= end.getTime();
  }
  // week-end : samedi 00:00 → dimanche 23:59 (celui en cours si on y est déjà).
  const d = new Date();
  const day = d.getDay(); // 0 dim … 6 sam
  const sat = new Date(d);
  sat.setDate(d.getDate() + (day === 0 ? -1 : 6 - day));
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return s <= sun.getTime() && e > sat.getTime();
}
const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "now", label: "🔴 Maintenant" },
  { key: "tonight", label: "🌙 Ce soir" },
  { key: "weekend", label: "🎉 Ce week-end" },
  { key: "", label: "Tout" },
];

function defaultDateTimes() {
  const now = new Date();
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const start = `${pad((now.getHours() + 1) % 24)}:00`;
  const end = `${pad((now.getHours() + 3) % 24)}:00`;
  return { date, start, end };
}

async function geocode(q: string) {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
    { headers: { "Accept-Language": "fr" } }
  );
  const arr = (await r.json()) as { lat: string; lon: string; display_name: string }[];
  if (arr[0]) return { lat: Number(arr[0].lat), lng: Number(arr[0].lon), label: arr[0].display_name };
  return null;
}

// ---- Page -------------------------------------------------------------------
export default function MapPage() {
  useDocumentTitle("Sorties près de toi");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canCreate =
    user?.role === "MUSICIAN" ||
    user?.role === "RECRUITER" ||
    user?.role === "ORGANIZER" ||
    user?.role === "FESTIVAL" ||
    user?.role === "VENUE";
  const [kindFilter, setKindFilter] = useState<"" | Category>("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("");
  const [zoom, setZoom] = useState(6);
  const [bbox, setBbox] = useState<Bbox | null>(null);

  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [search, setSearch] = useState("");
  const [searchMsg, setSearchMsg] = useState<string | null>(null);

  // Création
  const dt = defaultDateTimes();
  const [panelOpen, setPanelOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(dt.date);
  const [startTime, setStartTime] = useState(dt.start);
  const [endTime, setEndTime] = useState(dt.end);
  const [newLoc, setNewLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ["events-active"],
    queryFn: listActiveEvents,
    refetchInterval: 30000,
  });

  const { data: myEvents = [] } = useQuery({
    queryKey: ["events-mine"],
    queryFn: listMyEvents,
    enabled: canCreate,
  });

  // Lieux réels (OSM) de la zone visible, seulement en zoom rapproché.
  const listingsEnabled = zoom >= LISTING_MIN_ZOOM && !!bbox;
  const bboxKey = bbox
    ? [bbox.south, bbox.west, bbox.north, bbox.east].map((n) => n.toFixed(3)).join(",")
    : "";
  const { data: listings = [] } = useQuery({
    queryKey: ["venue-listings", bboxKey],
    queryFn: () => listVenueListings(bbox!, 300),
    enabled: listingsEnabled,
  });
  const claimMutation = useMutation({
    mutationFn: (id: string) => claimListing(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["venue-listings"] }),
  });

  const visibleEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          (!kindFilter || eventCategory(e) === kindFilter) &&
          matchesTimeFilter(e.startsAt, e.endsAt, timeFilter)
      ),
    [events, kindFilter, timeFilter]
  );
  const sorted = useMemo(
    () =>
      [...visibleEvents].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      ),
    [visibleEvents]
  );
  const points = useMemo(
    () => visibleEvents.map((e) => [e.lat, e.lng] as [number, number]),
    [visibleEvents]
  );

  const createMutation = useMutation({
    mutationFn: () => {
      const startsAt = new Date(`${date}T${startTime}`).toISOString();
      const endsAt = new Date(`${date}T${endTime}`).toISOString();
      return createEvent({
        title: title.trim() || undefined,
        note: note.trim() || undefined,
        lat: newLoc!.lat,
        lng: newLoc!.lng,
        startsAt,
        endsAt,
      });
    },
    onSuccess: () => {
      setPanelOpen(false);
      setTitle("");
      setNote("");
      setNewLoc(null);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ["events-active"] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events-active"] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
    },
  });

  // « Je monte sur scène » : un tap → géoloc → live immédiat de 2h sur la carte.
  const stageMutation = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      createEvent({
        note: "🔴 En live maintenant — viens écouter !",
        lat: coords.lat,
        lng: coords.lng,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    onSuccess: (_data, coords) => {
      setFlyTarget({ lat: coords.lat, lng: coords.lng, zoom: 15 });
      queryClient.invalidateQueries({ queryKey: ["events-active"] });
      queryClient.invalidateQueries({ queryKey: ["events-mine"] });
    },
    onError: (err) => setSearchMsg(getApiErrorMessage(err)),
  });

  function goOnStage() {
    setSearchMsg(null);
    if (!navigator.geolocation) {
      setSearchMsg("Géolocalisation indisponible sur ce navigateur.");
      return;
    }
    setSearchMsg("📡 Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSearchMsg(null);
        stageMutation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setSearchMsg("Autorise la géolocalisation pour monter sur scène."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  useAutoEndLiveOnMove(() => setSearchMsg("📍 Live coupé automatiquement (tu t'es déplacé)."));

  // Mon live en cours (si j'en ai un actif en ce moment).
  const myLiveNow = myEvents.find((e) => {
    const n = Date.now();
    return new Date(e.startsAt).getTime() <= n && new Date(e.endsAt).getTime() > n;
  });

  function locateMe() {
    setSearchMsg(null);
    if (!navigator.geolocation) {
      setSearchMsg("Géolocalisation indisponible sur ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setFlyTarget({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 14 }),
      () => setSearchMsg("Position refusée. Autorise la géolocalisation."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function useMyPositionForEvent() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setNewLoc(ll);
      setFlyTarget({ ...ll, zoom: 15 });
    });
  }

  async function handleSearch() {
    if (!search.trim()) return;
    setSearchMsg("Recherche…");
    const res = await geocode(search.trim());
    if (res) {
      setFlyTarget({ lat: res.lat, lng: res.lng, zoom: 13 });
      setSearchMsg(`📍 ${res.label.split(",").slice(0, 2).join(",")}`);
    } else {
      setSearchMsg("Lieu introuvable.");
    }
  }

  function submitEvent() {
    setFormError(null);
    if (!newLoc) {
      setFormError("Choisis un lieu : « Ma position » ou clique sur la carte.");
      return;
    }
    if (new Date(`${date}T${endTime}`) <= new Date(`${date}T${startTime}`)) {
      setFormError("L'heure de fin doit être après le début.");
      return;
    }
    createMutation.mutate();
  }

  const nowCount = visibleEvents.filter((e) => {
    const n = Date.now();
    return new Date(e.startsAt).getTime() <= n && new Date(e.endsAt).getTime() > n;
  }).length;

  const KIND_FILTERS: { key: "" | Category; label: string }[] = [
    { key: "", label: "Tout" },
    { key: "DJ", label: "🎧 DJ" },
    { key: "LIVE", label: "🎵 Live" },
    { key: "FESTIVAL", label: "🎪 Festival" },
    { key: "LIEUX", label: "🎉 Soirée" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* En-tête compact : titre + filtres sur peu de lignes */}
        <div className="mb-4">
          <h1 className="text-2xl font-black sm:text-3xl">
            <span className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              Qu'est-ce qui se passe près de toi&nbsp;?
            </span>{" "}
            🎉
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            <span className="font-semibold text-red-400">● {nowCount} en ce moment</span> ·{" "}
            {visibleEvents.length} à l'affiche
          </p>

          {/* Filtres sur une seule ligne : QUAND (primaire) puis TYPE */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {TIME_FILTERS.map((f) => {
              const active = timeFilter === f.key;
              return (
                <button
                  key={f.key || "all-time"}
                  onClick={() => setTimeFilter(f.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    active
                      ? "bg-white text-neutral-950 shadow-lg shadow-white/10"
                      : "border border-neutral-700 text-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
            <span className="mx-1 hidden h-5 w-px bg-neutral-700 sm:inline-block" />
            {KIND_FILTERS.map((f) => {
              const active = kindFilter === f.key;
              return (
                <button
                  key={f.key || "all"}
                  onClick={() => setKindFilter(f.key)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? "border-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 font-medium text-white"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-400"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barre d'outils : recherche lieu + autour de moi + créer */}
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-neutral-900 px-3 py-1.5">
            <span className="text-neutral-500">🔎</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Rechercher une ville, un quartier…"
              className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-neutral-500"
            />
            <button onClick={handleSearch} className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              OK
            </button>
          </div>
          {user?.role === "MUSICIAN" &&
            (myLiveNow ? (
              <button
                onClick={() => deleteMutation.mutate(myLiveNow.id)}
                className="flex items-center gap-2 rounded-xl border border-red-500 bg-red-500/20 px-4 py-2 text-sm font-bold text-red-200 transition-transform hover:-translate-y-0.5"
              >
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-400" />
                En live — Arrêter
              </button>
            ) : (
              <button
                onClick={goOnStage}
                disabled={stageMutation.isPending}
                className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 text-sm font-bold shadow-lg shadow-red-500/25 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                🎤 Je monte sur scène
              </button>
            ))}
          <button
            onClick={locateMe}
            className="rounded-xl border border-neutral-700 px-3 py-2 text-sm font-medium transition-colors hover:border-violet-400 hover:text-violet-200"
          >
            📍 Autour de moi
          </button>
          {canCreate && (
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-bold shadow-lg shadow-violet-500/25 transition-transform hover:-translate-y-0.5"
            >
              ✨ Créer un événement
            </button>
          )}
          {!user && (
            <Link
              to="/inscription"
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-bold shadow-lg shadow-violet-500/25 transition-transform hover:-translate-y-0.5"
            >
              ✨ Rejoindre
            </Link>
          )}
        </div>
        {searchMsg && <p className="mb-3 text-xs text-neutral-400">{searchMsg}</p>}

        {/* Panneau de création */}
        {canCreate && panelOpen && (
          <div className="mb-4 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-400">
                  {user?.role === "MUSICIAN" ? "Titre (sinon ton nom d'artiste)" : "Titre de l'événement *"}
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={user?.role === "RECRUITER" || user?.role === "VENUE" ? "Ex. Soirée jazz au comptoir" : "Ex. Set acoustique"}
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-400">Description</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ce que tu proposes, ambiance, style…"
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-400">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-400"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-neutral-400">Début</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-neutral-400">Fin</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={useMyPositionForEvent}
                className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:border-emerald-400 hover:text-emerald-300"
              >
                📍 Ma position
              </button>
              <span className="text-xs text-neutral-500">
                {newLoc
                  ? `✅ Lieu choisi (${newLoc.lat.toFixed(3)}, ${newLoc.lng.toFixed(3)})`
                  : "…ou clique sur la carte pour placer le point vert"}
              </span>
              <button
                onClick={submitEvent}
                disabled={createMutation.isPending}
                className="ml-auto rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-bold shadow-lg shadow-emerald-500/25 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {createMutation.isPending ? "Publication…" : "Publier l'événement"}
              </button>
            </div>
            {formError && <p className="mt-2 text-sm text-red-400">{formError}</p>}
          </div>
        )}

        {/* Carte + agenda */}
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="overflow-hidden rounded-2xl border border-neutral-800" style={{ height: "68vh" }}>
            {/* Zoom relooké « ampli » : + = monter (violet), simple et arrondi */}
            <style>{`
              /* Fond de carte sombre (thème nuit) : OSM assombri par filtre CSS,
                 sans fournisseur à clé. Les marqueurs (autre calque) restent intacts. */
              .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) saturate(0.75); }
              .leaflet-container { background: #0a0a0a; }
              .leaflet-control-zoom { border: none !important; border-radius: 16px !important; overflow: hidden;
                box-shadow: 0 6px 18px rgba(0,0,0,.55); margin: 14px !important; }
              .leaflet-control-zoom a { width: 42px !important; height: 42px !important; line-height: 42px !important;
                background: #17121f !important; color: #cbc3e4 !important; border: none !important;
                font-size: 24px !important; font-weight: 800; transition: filter .15s; }
              .leaflet-control-zoom a:hover { filter: brightness(1.15); }
              .leaflet-control-zoom-in { color: #fff !important;
                background: linear-gradient(180deg, #9b7bff, #7c5cf0) !important;
                border-bottom: 1px solid rgba(255,255,255,.12) !important; }
            `}</style>
            <MapContainer center={[46.6, 2.4]} zoom={6} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
              <FitBounds points={points} />
              <FlyTo target={flyTarget} />
              <ClickToPlace active={panelOpen} onPlace={(ll) => setNewLoc(ll)} />
              <BoundsWatch
                onChange={(z, b) => {
                  setZoom(z);
                  setBbox(b);
                }}
              />
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {visibleEvents.map((e) => (
                <Marker key={e.id} position={[e.lat, e.lng]} icon={pin(eventCategory(e))}>
                  <Popup>
                    <div style={{ minWidth: 170 }}>
                      <strong>{CAT_META[eventCategory(e)].emoji} {e.title}</strong>
                      {e.city && <div style={{ color: "#666", fontSize: 12 }}>{e.city}</div>}
                      {e.note && <div style={{ marginTop: 4, fontSize: 13 }}>{e.note}</div>}
                      <div style={{ marginTop: 4, fontSize: 12, color: "#7c3aed" }}>
                        🕒 {timeStr(e.startsAt)} – {timeStr(e.endsAt)}
                      </div>
                      {e.profileId && (
                        <Link to={`/musiciens/${e.profileId}`} style={{ color: "#7c3aed", fontSize: 13 }}>
                          Voir le profil →
                        </Link>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {/* Lieux réels (OSM), façon Google, en zoom rapproché */}
              {listingsEnabled &&
                listings.map((l) => (
                  <Marker key={l.id} position={[l.lat, l.lng]} icon={listingIcon(l.category, l.claimed)}>
                    <Popup>
                      <div style={{ minWidth: 190 }}>
                        <strong>
                          {listingMeta(l.category).emoji} {l.name}
                        </strong>
                        <div style={{ color: "#666", fontSize: 12 }}>
                          {listingMeta(l.category).label}
                          {l.address ? ` · ${l.address}` : ""}
                        </div>
                        {l.openingHours && (
                          <div style={{ marginTop: 4, fontSize: 12 }}>🕒 {l.openingHours}</div>
                        )}
                        {l.website && (
                          <div style={{ marginTop: 4 }}>
                            <a href={l.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#7c3aed" }}>
                              Site web →
                            </a>
                          </div>
                        )}
                        <div style={{ marginTop: 6, borderTop: "1px solid #eee", paddingTop: 6, fontSize: 12 }}>
                          {l.claimed ? (
                            <span style={{ color: "#059669", fontWeight: 600 }}>
                              ✓ Géré par l'établissement
                              {l.claimedProfileId && (
                                <>
                                  {" · "}
                                  <Link to={`/musiciens/${l.claimedProfileId}`} style={{ color: "#7c3aed" }}>
                                    voir la page
                                  </Link>
                                </>
                              )}
                            </span>
                          ) : user?.role === "VENUE" ? (
                            <button
                              onClick={() => claimMutation.mutate(l.id)}
                              disabled={claimMutation.isPending}
                              style={{ color: "#7c3aed", fontWeight: 600, background: "none", border: "none", padding: 0, cursor: "pointer" }}
                            >
                              C'est mon établissement — revendiquer
                            </button>
                          ) : (
                            <span style={{ color: "#999" }}>
                              Fiche non revendiquée
                              {!user && (
                                <>
                                  {" · "}
                                  <Link to="/inscription/lieu" style={{ color: "#7c3aed" }}>
                                    c'est votre lieu ?
                                  </Link>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              {newLoc && <Marker position={[newLoc.lat, newLoc.lng]} icon={pin("NEW")} />}
            </MapContainer>
          </div>

          {/* Agenda trié par heure */}
          <div
            className="flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40"
            style={{ height: "68vh" }}
          >
            <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
              <span>🗓️</span>
              <h2 className="text-sm font-bold">L'agenda · par heure</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sorted.length === 0 ? (
                <div className="p-4 text-sm text-neutral-500">
                  {kindFilter ? (
                    <>
                      <p>Aucun événement dans cette catégorie pour le moment.</p>
                      <button
                        onClick={() => setKindFilter("")}
                        className="mt-2 font-medium text-violet-300 hover:text-violet-200"
                      >
                        ← Voir tout
                      </button>
                    </>
                  ) : (
                    <p>Aucun événement pour le moment.</p>
                  )}
                </div>
              ) : (
                sorted.map((e) => {
                  const w = whenLabel(e.startsAt, e.endsAt);
                  const accent = CAT_META[eventCategory(e)].color;
                  const mine = myEvents.some((m) => m.id === e.id);
                  return (
                    <div
                      key={e.id}
                      className="flex gap-3 border-b border-neutral-800/60 px-4 py-3 hover:bg-neutral-800/40"
                      style={{ borderLeft: `3px solid ${accent}` }}
                    >
                      <div className="w-11 shrink-0 text-center">
                        <div className="text-sm font-bold tabular-nums">{timeStr(e.startsAt)}</div>
                        <div className="text-[10px] text-neutral-500">{timeStr(e.endsAt)}</div>
                      </div>
                      <div
                        className="h-11 w-11 shrink-0 overflow-hidden rounded-lg"
                        style={{ background: accent + "22" }}
                      >
                        {e.coverPhotoUrl ? (
                          <img src={e.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg">
                            {CAT_META[eventCategory(e)].emoji}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {CAT_META[eventCategory(e)].emoji} {e.title}
                        </p>
                        {e.note && <p className="truncate text-xs text-neutral-400">{e.note}</p>}
                        <p className="mt-0.5 text-xs">
                          {e.city && <span className="text-neutral-500">{e.city} · </span>}
                          <span className={w.live ? "font-semibold text-red-400" : "text-neutral-400"}>
                            {w.live ? "🔴 en ce moment" : w.text}
                          </span>
                        </p>
                        <div className="mt-1 flex gap-3">
                          {e.profileId && (
                            <Link to={`/musiciens/${e.profileId}`} className="text-xs text-violet-300 hover:text-violet-200">
                              Profil →
                            </Link>
                          )}
                          <button
                            onClick={() => setFlyTarget({ lat: e.lat, lng: e.lng, zoom: 15 })}
                            className="text-xs text-neutral-400 hover:text-white"
                          >
                            Voir sur la carte
                          </button>
                          {mine && (
                            <button
                              onClick={() => deleteMutation.mutate(e.id)}
                              className="text-xs text-neutral-500 hover:text-red-400"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
