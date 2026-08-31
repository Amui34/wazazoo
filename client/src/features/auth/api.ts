import { api } from "../../lib/api.js";

export type UserRole =
  | "MUSICIAN"
  | "RECRUITER"
  | "ADMIN"
  | "TOURIST"
  | "ORGANIZER"
  | "FESTIVAL"
  | "VENUE";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
};

export async function signup(input: {
  email: string;
  password: string;
  role: "MUSICIAN" | "RECRUITER" | "TOURIST" | "ORGANIZER" | "FESTIVAL" | "VENUE";
  acceptedTerms: true;
}) {
  const { data } = await api.post<{
    user: { id: string; email: string; role: UserRole };
  }>("/api/auth/signup", input);
  return data;
}

export async function login(input: { email: string; password: string }) {
  const { data } = await api.post<{ user: { id: string; email: string; role: UserRole } }>(
    "/api/auth/login",
    input
  );
  return data;
}

export async function logout() {
  await api.post("/api/auth/logout");
}

export async function verifyEmail(token: string) {
  await api.post("/api/auth/verify-email", { token });
}

export async function resendVerification(email: string) {
  const { data } = await api.post<{ message: string }>("/api/auth/resend-verification", {
    email,
  });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<{ user: CurrentUser }>("/api/auth/me");
  return data.user;
}
