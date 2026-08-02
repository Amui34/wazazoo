import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent, deleteEvent, listMyEvents } from "../features/events/api.js";
import { useAutoEndLiveOnMove } from "../features/events/useAutoEndLiveOnMove.js";
import { getApiErrorMessage } from "../lib/api.js";

// Bouton « Je monte sur scène » : un tap → géoloc → live immédiat de 2h,
// visible aussitôt sur la carte. Réutilisable (tableau de bord, carte…).
export function OnStageButton({ variant = "card" }: { variant?: "card" | "inline" }) {
  const queryClient = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);

  const { data: myEvents = [] } = useQuery({ queryKey: ["events-mine"], queryFn: listMyEvents });

  useAutoEndLiveOnMove(() =>
    setMsg("📍 Tu t'es déplacé — ton direct s'est coupé automatiquement.")
  );

  const liveNow = myEvents.find((e) => {
    const n = Date.now();
    return new Date(e.startsAt).getTime() <= n && new Date(e.endsAt).getTime() > n;
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["events-mine"] });
    queryClient.invalidateQueries({ queryKey: ["events-active"] });
  };

  const startMutation = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      createEvent({
        note: "🔴 En live maintenant — viens écouter !",
        lat: coords.lat,
        lng: coords.lng,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }),
    onSuccess: () => {
      setMsg("✅ Tu es en live sur la carte pour 2h !");
      invalidate();
    },
    onError: (err) => setMsg(getApiErrorMessage(err)),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      setMsg("Tu n'es plus en live.");
      invalidate();
    },
  });

  function goOnStage() {
    setMsg(null);
    if (!navigator.geolocation) {
      setMsg("Géolocalisation indisponible sur ce navigateur.");
      return;
    }
    setMsg("📡 Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMsg(null);
        startMutation.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setMsg("Autorise la géolocalisation pour monter sur scène."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const button = liveNow ? (
    <button
      onClick={() => stopMutation.mutate(liveNow.id)}
      disabled={stopMutation.isPending}
      className="flex items-center gap-2 rounded-xl border border-red-500 bg-red-500/20 px-5 py-3 text-sm font-bold text-red-200 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
    >
      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
      En live — Arrêter
    </button>
  ) : (
    <button
      onClick={goOnStage}
      disabled={startMutation.isPending}
      className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/25 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
    >
      🎤 {startMutation.isPending ? "Un instant…" : "Je monte sur scène"}
    </button>
  );

  if (variant === "inline") {
    return (
      <div>
        {button}
        {msg && <p className="mt-1 text-xs text-neutral-400">{msg}</p>}
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-lg border border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Tu joues maintenant&nbsp;?</p>
          <p className="mt-0.5 text-sm text-neutral-400">
            {liveNow
              ? "Tu es visible en direct sur la carte. Le public peut te trouver."
              : "Appuie et apparais instantanément sur la carte, là où tu es."}
          </p>
        </div>
        {button}
      </div>
      {msg && <p className="mt-2 text-sm text-neutral-300">{msg}</p>}
    </section>
  );
}
