"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
// 1. Import all Lucide icons as a lookup object map
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap = Icons as unknown as Record<string, LucideIcon>;

export function DashboardSidebar({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  // 2. Rewrite match logic to look at our primitive flags instead of function callbacks
  function isActive(item: NavItem) {
    if (item.exact) {
      return pathname === item.href;
    }
    if (item.excludePrefix && pathname.startsWith(item.excludePrefix)) {
      return false;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <aside className="hidden w-60 flex-none border-r border-charcoal-100 bg-white md:block">
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-y-auto p-4">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-400">{title}</p>
        <nav className="space-y-1">
          {items.map((item) => {
            const active = isActive(item);
            
            // 3. Look up icon by its string name cleanly. Fall back safely to HelpCircle if a key is missed.
            const Icon = iconMap[item.iconName] ?? Icons.HelpCircle;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-amber-50 text-amber-800" : "text-charcoal-600 hover:bg-charcoal-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
