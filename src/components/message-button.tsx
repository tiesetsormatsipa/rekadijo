"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { getOrCreateQuotationConversation } from "@/server/actions/messaging";

export function MessageButton({ quotationId, label = "Message" }: { quotationId: string; label?: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await getOrCreateQuotationConversation(quotationId);
          if (!res.ok) toast.error(res.error);
          else router.push(`/dashboard/messages/${res.conversationId}`);
        })
      }
      className="inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:bg-charcoal-50 focus-ring"
    >
      <MessageCircle className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
