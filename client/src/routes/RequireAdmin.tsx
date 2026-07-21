import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext.js";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Chargement...
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/connexion" replace />;
  }

  return <>{children}</>;
}
