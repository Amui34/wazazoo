import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyEvents, deleteEvent } from "./api.js";
import { useAuth } from "../auth/AuthContext.js";

// Distance au-delà de laquelle on considère que l'artiste a quitté son spot.
const THRESHOLD_M = 250;

function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Tant qu'un direct est en cours, surveille la position : si l'artiste s'éloigne
// de plus de ~250 m de son point, le direct est coupé automatiquement.
// (Fonctionne tant que WAZAZOO est ouvert ; le vrai suivi en arrière-plan viendra
//  avec l'app mobile native.)
export function useAutoEndLiveOnMove(onCut?: () => void) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: myEvents = [] } = useQuery({
    queryKey: ["events-mine"],
    queryFn: listMyEvents,
    enabled: user?.role === "MUSICIAN",
  });

  const live = myEvents.find((e) => {
    const n = Date.now();
    return new Date(e.startsAt).getTime() <= n && new Date(e.endsAt).getTime() > n;
  });
  const liveId = live?.id;
  const oLat = live?.lat;
  const oLng = live?.lng;

  useEffect(() => {
    if (!liveId || oLat == null || oLng == null || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const d = distanceMeters(oLat, oLng, pos.coords.latitude, pos.coords.longitude);
        if (d > THRESHOLD_M) {
          navigator.geolocation.clearWatch(watchId);
          deleteEvent(liveId)
            .then(() => {
              qc.invalidateQueries({ queryKey: ["events-mine"] });
              qc.invalidateQueries({ queryKey: ["events-active"] });
              onCut?.();
            })
            .catch(() => {});
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveId, oLat, oLng]);
}
