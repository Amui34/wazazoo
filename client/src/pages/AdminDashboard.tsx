import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { Badge } from "../components/Badge.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import {
  listAdminProfiles,
  suspendProfile,
  reactivateProfile,
  listAdminUsers,
  listAdminCertifications,
} from "../features/admin/api.js";

const statusLabel: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  DECLINED: "Refusée",
  EXPIRED: "Expirée",
};

export default function AdminDashboard() {
  useDocumentTitle("Administration");
  const [tab, setTab] = useState<"profiles" | "users" | "certifications">("profiles");
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: listAdminProfiles,
  });
  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listAdminUsers,
    enabled: tab === "users",
  });
  const { data: certifications = [] } = useQuery({
    queryKey: ["admin", "certifications"],
    queryFn: listAdminCertifications,
    enabled: tab === "certifications",
  });

  const suspendMutation = useMutation({
    mutationFn: suspendProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] }),
  });
  const reactivateMutation = useMutation({
    mutationFn: reactivateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] }),
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />
      <div className="relative">
        <Navbar />
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-2xl font-semibold">Administration</h1>

          <div className="mt-6 flex gap-2 border-b border-neutral-800">
            {(["profiles", "users", "certifications"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 px-3 py-2 text-sm ${
                  tab === t ? "border-white text-white" : "border-transparent text-neutral-500"
                }`}
              >
                {t === "profiles" ? "Profils" : t === "users" ? "Utilisateurs" : "Certifications"}
              </button>
            ))}
          </div>

          {tab === "profiles" && (
            <div className="mt-6 space-y-2">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{p.displayName || "(sans nom)"}</p>
                    <p className="text-xs text-neutral-500">
                      {p.email} · {p.city ?? "ville non renseignée"} · {p.certificationsCount} certification(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={p.status === "PUBLISHED" ? "success" : "neutral"}>{p.status}</Badge>
                    {p.status === "SUSPENDED" ? (
                      <button
                        onClick={() => reactivateMutation.mutate(p.id)}
                        className="text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        Réactiver
                      </button>
                    ) : (
                      <button
                        onClick={() => suspendMutation.mutate(p.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Suspendre
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "users" && (
            <div className="mt-6 space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3"
                >
                  <p className="text-sm">{u.email}</p>
                  <div className="flex items-center gap-3">
                    <Badge>{u.role}</Badge>
                    <Badge tone={u.emailVerifiedAt ? "success" : "neutral"}>
                      {u.emailVerifiedAt ? "Vérifié" : "Non vérifié"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "certifications" && (
            <div className="mt-6 space-y-2">
              {certifications.map((c) => (
                <div key={c.id} className="rounded-md border border-neutral-800 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      {c.musicianDisplayName} → {c.venueName}
                    </p>
                    <Badge tone={c.status === "CONFIRMED" ? "success" : "neutral"}>
                      {statusLabel[c.status]}
                    </Badge>
                  </div>
                  {c.review && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {c.review.rating}/5 {c.review.comment && `— "${c.review.comment}"`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
