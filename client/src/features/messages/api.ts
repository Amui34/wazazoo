import { api } from "../../lib/api.js";

export type Conversation = {
  contactRequestId: string;
  profileId: string;
  otherName: string;
  role: "RECRUITER" | "MUSICIAN";
  lastMessage: string | null;
  lastAt: string;
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
};

export type Thread = {
  contactRequestId: string;
  otherName: string;
  profileId: string;
  messages: ChatMessage[];
};

export async function listConversations() {
  const { data } = await api.get<{ conversations: Conversation[] }>("/api/messages/conversations");
  return data.conversations;
}

export async function getThread(contactRequestId: string) {
  const { data } = await api.get<{ thread: Thread }>(`/api/messages/${contactRequestId}`);
  return data.thread;
}

export async function sendMessage(contactRequestId: string, body: string) {
  const { data } = await api.post<{ message: ChatMessage }>(`/api/messages/${contactRequestId}`, { body });
  return data.message;
}
