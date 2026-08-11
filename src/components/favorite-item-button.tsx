"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { toggleFavoriteMenuItemAction } from "@/server/actions/buyer";
import { cn } from "@/lib/utils";

export function FavoriteItemButton({ menuItemId, initiallyFavorited }: { menuItemId: string; initiallyFavorited: boolean }) {
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleFavoriteMenuItemAction(menuItemId);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          setFavorited(res.favorited);
        })
      }
      className="flex h-7 w-7 flex-none items-center justify-center rounded-full hover:bg-charcoal-50 focus-ring"
      aria-label="Favorite this item"
    >
      <Heart className={cn("h-4 w-4", favorited ? "fill-amber-600 text-amber-600" : "text-charcoal-300")} />
    </button>
  );
}
