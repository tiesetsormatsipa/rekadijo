"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GlobalRole } from "@prisma/client";
import { navForRole } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";

const AUTH_HIDDEN_PREFIXES = ["/login", "/register"];
const iconMap = Icons as unknown as Record<string, LucideIcon>;

export function BottomNav({ role }: { role: GlobalRole | null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { totalItemCount } = useCartStore();

  if (AUTH_HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const { tabs, full, area } = navForRole(role);
  // Vendors have more sections than fit in 4 tabs — the rest live behind "More".
  const overflow = full.filter((item) => !tabs.some((t) => t.href === item.href));
  const showMore = overflow.length > 0;

  // 2. Updated path matcher logic to look for primitive configurations instead of raw callbacks
  function isActive(item: (typeof tabs)[number]) {
    if (item.exact) {
      return pathname === item.href;
    }
    if (item.excludePrefix && pathname.startsWith(item.excludePrefix)) {
      return false;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal-100 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {tabs.map((item) => {
            const active = isActive(item);
            
            // 3. Resolve tab icons safely via string name lookup
            const Icon = iconMap[item.iconName] ?? Icons.HelpCircle;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium"
              >
                <Icon className={cn("h-5 w-5", active ? "text-amber-600" : "text-charcoal-400")} />
                <span className={cn("truncate", active ? "text-amber-700" : "text-charcoal-400")}>{item.label}</span>
                {item.label === "Orders" && area === "buyer" && totalItemCount > 0 && (
                  <span className="absolute right-3 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[9px] font-semibold text-white">
                    {totalItemCount > 9 ? "9+" : totalItemCount}
                  </span>
                )}
              </Link>
            );
          })}
          {showMore && (
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-charcoal-400"
            >
              <MoreHorizontal className="h-5 w-5" />
              More
            </button>
          )}
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-charcoal-900/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2">
              <span className="font-display text-lg font-semibold text-charcoal-900">More</span>
              <button onClick={() => setMoreOpen(false)} className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 pb-4 pt-2">
              {overflow.map((item) => {
                // 4. Resolve the modal overflow actions drawer icons using item.iconName here too
                const OverflowIcon = iconMap[item.iconName] ?? Icons.HelpCircle;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-charcoal-100 p-4 text-center text-xs font-medium text-charcoal-700 hover:bg-charcoal-50"
                  >
                    <OverflowIcon className="h-5 w-5 text-amber-600" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
