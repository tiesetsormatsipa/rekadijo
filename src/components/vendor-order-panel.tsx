"use client";

import { useState } from "react";
import { FileText, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function VendorOrderPanel({
  instant,
  quotation,
  hasInstant
}: {
  instant: React.ReactNode;
  quotation: React.ReactNode;
  hasInstant: boolean;
}) {
  const [active, setActive] = useState<"instant" | "quotation">(hasInstant ? "instant" : "quotation");

  return (
    <div id="order-panel" className="sticky top-24 space-y-3">
      <div className="rounded-full border border-charcoal-200 bg-white p-1 shadow-sm">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            disabled={!hasInstant}
            onClick={() => setActive("instant")}
            className={cn(
              "flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
              active === "instant" ? "bg-charcoal-900 text-white" : "text-charcoal-600 hover:bg-charcoal-50"
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            Order now
          </button>
          <button
            type="button"
            onClick={() => setActive("quotation")}
            className={cn(
              "flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition",
              active === "quotation" ? "bg-charcoal-900 text-white" : "text-charcoal-600 hover:bg-charcoal-50"
            )}
          >
            <FileText className="h-4 w-4" />
            Quote
          </button>
        </div>
      </div>

      {active === "instant" && hasInstant ? instant : quotation}
    </div>
  );
}
