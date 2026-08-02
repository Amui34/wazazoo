import { api } from "../../lib/api.js";

export type FavoriteArtist = {
  id: string;
  displayName: string;
  city: string | null;
  profileType: "MUSICIAN" | "DJ";
  coverPhotoUrl: string | null;
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function followArtist(profileId: string) {
  await api.post(`/api/follows/${profileId}`);
}

export async function unfollowArtist(profileId: string) {
  await api.delete(`/api/follows/${profileId}`);
}

export async function listFavorites() {
  const { data } = await api.get<{ profiles: FavoriteArtist[] }>("/api/follows/mine");
  return data.profiles;
}

export async function listNotifications() {
  const { data } = await api.get<{ notifications: Notification[]; unreadCount: number }>(
    "/api/notifications"
  );
  return data;
}

export async function markNotificationsRead() {
  await api.post("/api/notifications/read");
}
