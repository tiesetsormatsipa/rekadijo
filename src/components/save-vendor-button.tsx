"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { toggleSavedVendorAction } from "@/server/actions/buyer";
import { cn } from "@/lib/utils";

export function SaveVendorButton({ businessId, initiallySaved }: { businessId: string; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleSavedVendorAction(businessId);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          setSaved(res.saved);
          toast.success(res.saved ? "Saved to your vendors." : "Removed from saved vendors.");
        })
      }
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition focus-ring",
        saved ? "border-amber-600 bg-amber-50 text-amber-800" : "border-charcoal-200 text-charcoal-600 hover:bg-charcoal-50"
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-amber-600 text-amber-600")} />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
