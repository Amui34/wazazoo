import { api } from "../../lib/api.js";

export type ContactRequestReceived = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  message: string;
  createdAt: string;
  recruiter: { id: string; email: string };
};

export type ContactRequestSent = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  message: string;
  createdAt: string;
  profile: { id: string; displayName: string };
};

export async function sendContactRequest(input: { profileId: string; message: string }) {
  const { data } = await api.post<{ contactRequest: { id: string } }>("/api/contact-requests", input);
  return data.contactRequest;
}

export async function listReceivedContactRequests() {
  const { data } = await api.get<{ contactRequests: ContactRequestReceived[] }>(
    "/api/contact-requests/received"
  );
  return data.contactRequests;
}

export async function listSentContactRequests() {
  const { data } = await api.get<{ contactRequests: ContactRequestSent[] }>("/api/contact-requests/sent");
  return data.contactRequests;
}

export async function getContactRequestDetail(id: string) {
  const { data } = await api.get<{
    contactRequest: {
      id: string;
      status: string;
      message: string;
      profile: { id: string; displayName: string };
      contactInfo: { email: string; phone: string | null } | null;
    };
  }>(`/api/contact-requests/${id}`);
  return data.contactRequest;
}

export async function acceptContactRequest(id: string) {
  await api.post(`/api/contact-requests/${id}/accept`);
}

export async function declineContactRequest(id: string) {
  await api.post(`/api/contact-requests/${id}/decline`);
}
