import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveSpot } from "../features/live/api.js";

// Cadre la carte pour montrer tous les pins actifs.
function FitBounds({ spots }: { spots: LiveSpot[] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (spots.length > 0) {
      const bounds = L.latLngBounds(spots.map((s) => [s.lat, s.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }
  }, [spots, map]);
  return null;
}
import { Navbar } from "../components/Navbar.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../features/auth/AuthContext.js";
import { listActiveSpots, getMyLive, goLive, endLive } from "../features/live/api.js";
import { getApiErrorMessage } from "../lib/api.js";

function pinIcon(type: "MUSICIAN" | "DJ", mine: boolean) {
  const bg = mine ? "#22c55e" : type === "DJ" ? "#d946ef" : "#8b5cf6";
  const emoji = type === "DJ" ? "🎧" : "🎵";
  return L.divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${bg};border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:15px">${emoji}</span></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

function minutesLeft(endsAt: string) {
  const m = Math.round((new Date(endsAt).getTime() - Date.now()) / 60000);
  if (m <= 0) return "bientôt terminé";
  if (m < 60) return `encore ~${m} min`;
  return `encore ~${Math.round(m / 60)} h`;
}

export default function MapPage() {
  useDocumentTitle("Carte des lives");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState(120);
  const [error, setError] = useState<string | null>(null);

  const { data: spots = [] } = useQuery({
    queryKey: ["live-spots"],
    queryFn: listActiveSpots,
    refetchInterval: 20000,
  });

  const { data: myLive } = useQuery({
    queryKey: ["my-live"],
    queryFn: getMyLive,
    enabled: user?.role === "MUSICIAN",
  });

  const goLiveMutation = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      goLive({ lat: coords.lat, lng: coords.lng, note: note || undefined, durationMin: duration }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["live-spots"] });
      queryClient.invalidateQueries({ queryKey: ["my-live"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const endMutation = useMutation({
    mutationFn: endLive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-spots"] });
      queryClient.invalidateQueries({ queryKey: ["my-live"] });
    },
  });

  function handleGoLive() {
    setError(null);
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => goLiveMutation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Position refusée. Autorise la géolocalisation pour te mettre en live."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              En direct autour de toi
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              {spots.length} artiste{spots.length !== 1 ? "s" : ""} en train de jouer en ce moment.
            </p>
          </div>
        </div>

        {/* Panneau artiste : se mettre en live */}
        {user?.role === "MUSICIAN" && (
          <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
            {myLive ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-emerald-400">
                  🎶 Tu es en live ({minutesLeft(myLive.endsAt)}){myLive.note ? ` — « ${myLive.note} »` : ""}
                </p>
                <button
                  onClick={() => endMutation.mutate()}
                  className="rounded-md border border-neutral-700 px-4 py-2 text-sm hover:border-red-500 hover:text-red-400"
                >
                  Terminer le live
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ce que tu joues (ex. jazz manouche…)"
                  className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-400"
                />
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
                >
                  <option value={60}>1 h</option>
                  <option value={120}>2 h</option>
                  <option value={180}>3 h</option>
                </select>
                <button
                  onClick={handleGoLive}
                  disabled={goLiveMutation.isPending}
                  className="rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  📍 Je joue ici — me mettre en live
                </button>
              </div>
            )}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-neutral-800" style={{ height: "68vh" }}>
          <MapContainer center={[46.6, 2.4]} zoom={6} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <FitBounds spots={spots} />
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {spots.map((s) => (
              <Marker
                key={s.id}
                position={[s.lat, s.lng]}
                icon={pinIcon(s.profileType, myLive?.id === s.id)}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>{s.displayName}</strong>
                    {s.city && <div style={{ color: "#666", fontSize: 12 }}>{s.city}</div>}
                    {s.note && <div style={{ marginTop: 4, fontSize: 13 }}>« {s.note} »</div>}
                    <div style={{ marginTop: 4, fontSize: 12, color: "#c026d3" }}>🔴 {minutesLeft(s.endsAt)}</div>
                    <Link to={`/musiciens/${s.profileId}`} style={{ color: "#7c3aed", fontSize: 13 }}>
                      Voir le profil →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
