import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { listNotifications, markNotificationsRead } from "../features/social/api.js";

function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function Notifications() {
  useDocumentTitle("Notifications");
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: listNotifications });

  useEffect(() => {
    markNotificationsRead()
      .then(() => qc.invalidateQueries({ queryKey: ["notifications"] }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifications = data?.notifications ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />
      <div className="relative">
        <Navbar />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="text-2xl font-semibold">🔔 Notifications</h1>
          <div className="mt-6 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Aucune notification pour l'instant. Suis des artistes pour être prévenu quand ils
                montent sur scène !
              </p>
            ) : (
              notifications.map((n) => {
                const inner = (
                  <div
                    className={`rounded-lg border p-4 transition-colors ${
                      n.readAt ? "border-neutral-800" : "border-violet-500/40 bg-violet-500/5"
                    }`}
                  >
                    <p className="text-sm">{n.message}</p>
                    <p className="mt-1 text-xs text-neutral-500">{timeAgo(n.createdAt)}</p>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} to={n.link} className="block hover:opacity-90">
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
