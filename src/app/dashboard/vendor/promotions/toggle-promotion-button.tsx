"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { togglePromotionAction } from "@/server/actions/promotions";

export function TogglePromotionButton({ promotionId, isActive }: { promotionId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await togglePromotionAction(promotionId);
          if (!res.ok) toast.error(res.error);
          else router.refresh();
        })
      }
      className="text-xs font-medium text-charcoal-600 hover:underline"
    >
      {isActive ? "Pause" : "Resume"}
    </button>
  );
}
