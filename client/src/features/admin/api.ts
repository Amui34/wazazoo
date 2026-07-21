import { api } from "../../lib/api.js";

export type AdminProfile = {
  id: string;
  displayName: string;
  city: string | null;
  status: "DRAFT" | "PUBLISHED" | "SUSPENDED";
  email: string;
  emailVerified: boolean;
  certificationsCount: number;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "MUSICIAN" | "RECRUITER" | "ADMIN";
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type AdminCertification = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "EXPIRED";
  musicianDisplayName: string;
  venueName: string | null;
  performanceDate: string | null;
  confirmedAt: string | null;
  createdAt: string;
  review: { rating: number; comment: string | null } | null;
};

export async function listAdminProfiles() {
  const { data } = await api.get<{ profiles: AdminProfile[] }>("/api/admin/profiles");
  return data.profiles;
}

export async function suspendProfile(id: string) {
  await api.post(`/api/admin/profiles/${id}/suspend`);
}

export async function reactivateProfile(id: string) {
  await api.post(`/api/admin/profiles/${id}/reactivate`);
}

export async function listAdminUsers() {
  const { data } = await api.get<{ users: AdminUser[] }>("/api/admin/users");
  return data.users;
}

export async function listAdminCertifications() {
  const { data } = await api.get<{ certifications: AdminCertification[] }>("/api/admin/certifications");
  return data.certifications;
}
