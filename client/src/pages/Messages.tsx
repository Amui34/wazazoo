import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar.js";
import { AmbientLights } from "../components/AmbientLights.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { listConversations, getThread, sendMessage } from "../features/messages/api.js";
import { getApiErrorMessage } from "../lib/api.js";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Messages() {
  useDocumentTitle("Messagerie");
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    refetchInterval: 10000,
  });

  // Sélectionne automatiquement la première conversation.
  useEffect(() => {
    if (!selected && conversations.length > 0) setSelected(conversations[0].contactRequestId);
  }, [conversations, selected]);

  const { data: thread } = useQuery({
    queryKey: ["thread", selected],
    queryFn: () => getThread(selected!),
    enabled: Boolean(selected),
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendMessage(selected!, body),
    onSuccess: () => {
      setDraft("");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["thread", selected] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  function handleSend() {
    const body = draft.trim();
    if (!body) return;
    sendMutation.mutate(body);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <AmbientLights />
      <div className="relative">
        <Navbar />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="mb-6 animate-fade-in-up text-2xl font-semibold">Messagerie</h1>

          {conversations.length === 0 ? (
            <div className="animate-fade-in-up rounded-lg border border-neutral-800 p-10 text-center text-neutral-400">
              <p className="text-3xl">💬</p>
              <p className="mt-3 text-sm">
                Aucune conversation pour l'instant. Une conversation s'ouvre quand une demande de contact est
                acceptée.
              </p>
            </div>
          ) : (
            <div className="grid animate-fade-in-up gap-4 md:grid-cols-[300px_1fr]">
              {/* Liste des conversations */}
              <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-neutral-800">
                {conversations.map((c) => (
                  <button
                    key={c.contactRequestId}
                    onClick={() => setSelected(c.contactRequestId)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-neutral-800 px-4 py-3 text-left transition-colors duration-150 ${
                      selected === c.contactRequestId ? "bg-neutral-900" : "hover:bg-neutral-900/60"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate font-medium">{c.otherName}</span>
                      {c.unreadCount > 0 && (
                        <span className="shrink-0 rounded-full bg-violet-500 px-2 py-0.5 text-xs font-semibold">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="line-clamp-1 text-xs text-neutral-500">
                      {c.lastMessage ?? "Conversation ouverte"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Fil de discussion */}
              <div className="flex h-[70vh] flex-col rounded-lg border border-neutral-800">
                {thread ? (
                  <>
                    <div className="border-b border-neutral-800 px-5 py-3">
                      <p className="font-medium">{thread.otherName}</p>
                    </div>
                    <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
                      {thread.messages.length === 0 && (
                        <p className="mt-6 text-center text-sm text-neutral-500">
                          Aucun message. Écris le premier !
                        </p>
                      )}
                      {thread.messages.map((m) => (
                        <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                              m.mine
                                ? "rounded-br-sm bg-violet-600 text-white"
                                : "rounded-bl-sm bg-neutral-800 text-neutral-100"
                            }`}
                          >
                            <p className="whitespace-pre-line">{m.body}</p>
                            <p className={`mt-1 text-[10px] ${m.mine ? "text-violet-200" : "text-neutral-500"}`}>
                              {formatTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                    <div className="border-t border-neutral-800 p-3">
                      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
                      <div className="flex gap-2">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          placeholder="Écris ton message…"
                          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-violet-400"
                        />
                        <button
                          onClick={handleSend}
                          disabled={!draft.trim() || sendMutation.isPending}
                          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-50"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
                    Sélectionne une conversation.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
