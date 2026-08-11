"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { sendMessageAction, markConversationReadAction } from "@/server/actions/messaging";
import { cn } from "@/lib/utils";

type MessageLite = { id: string; body: string; senderId: string; senderName: string; createdAt: string };

export function MessageThread({
  conversationId,
  currentUserId,
  messages
}: {
  conversationId: string;
  currentUserId: string;
  messages: MessageLite[];
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    markConversationReadAction(conversationId);
  }, [conversationId]);

  function send() {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await sendMessageAction({ conversationId, body });
      if (!res.ok) toast.error(res.error);
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-6 flex h-[60vh] flex-col rounded-2xl border border-charcoal-100 bg-white shadow-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-sm text-charcoal-400">No messages yet — say hello.</p>}
        {messages.map((m) => {
          const isMine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isMine ? "bg-amber-600 text-white" : "bg-charcoal-100 text-charcoal-800"
                )}
              >
                {!isMine && <p className="mb-0.5 text-xs font-semibold opacity-70">{m.senderName}</p>}
                <p>{m.body}</p>
                <p className={cn("mt-1 text-[10px]", isMine ? "text-amber-100" : "text-charcoal-400")}>
                  {new Date(m.createdAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 border-t border-charcoal-100 p-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-charcoal-200 px-4 py-2 text-sm focus-ring"
        />
        <button
          onClick={send}
          disabled={pending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-white hover:bg-amber-700 focus-ring disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
