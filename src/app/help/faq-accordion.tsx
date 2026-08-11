"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqAccordion({ items }: { items: Array<{ q: string; a: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
      {items.map((item, i) => (
        <div key={item.q}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 p-4 text-left"
          >
            <span className="text-sm font-medium text-charcoal-800">{item.q}</span>
            <ChevronDown className={cn("h-4 w-4 flex-none text-charcoal-400 transition-transform", openIndex === i && "rotate-180")} />
          </button>
          {openIndex === i && <p className="px-4 pb-4 text-sm text-charcoal-500">{item.a}</p>}
        </div>
      ))}
    </div>
  );
}
