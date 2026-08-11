"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";
// 1. Import all icons as a lookup map to resolve icon string keys
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { GlobalRole } from "@prisma/client";
import { PUBLIC_NAV, navForRole, DASHBOARD_PATH, type NavItem } from "@/lib/nav-config";
import { logoutAction } from "@/server/actions/auth";
import { cn } from "@/lib/utils";

const iconMap = Icons as unknown as Record<string, LucideIcon>;

export function MobileMenu({ user }: { user: { firstName: string; globalRole: GlobalRole } | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const { full, area } = navForRole(user?.globalRole ?? null);
  const isOnDashboard = pathname.startsWith("/dashboard");

  // 2. Safe, primitive path matcher matching the sidebar and bottom nav
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
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-charcoal-200 bg-white text-charcoal-700 shadow-sm transition hover:bg-charcoal-50 active:scale-95 md:hidden focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div 
            className="absolute inset-0 bg-charcoal-950/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
            onClick={() => setOpen(false)} 
          />
          
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl border-l border-charcoal-100/80 animate-in slide-in-from-right duration-300 ease-in-out">
            
            <div className="flex items-center justify-between border-b border-charcoal-100 p-4">
              <span className="font-display text-base font-semibold tracking-tight text-charcoal-900">
                Navigation Menu
              </span>
              <button 
                onClick={() => setOpen(false)} 
                className="flex h-8 w-8 items-center justify-center rounded-lg text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700 transition" 
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {user && (
              <div className="bg-charcoal-50/60 border-b border-charcoal-100 px-5 py-3.5">
                <p className="text-xs text-charcoal-400 font-medium">Logged in as</p>
                <p className="text-sm font-bold text-charcoal-900 truncate mt-0.5">Hi, {user.firstName}</p>
                <span className="inline-block mt-1.5 capitalize bg-charcoal-200/60 text-charcoal-700 px-2 py-0.5 rounded-md font-semibold tracking-wide text-[10px]">
                  {user.globalRole.replaceAll("_", " ").toLowerCase()}
                </span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Role-Specific Dashboard Links */}
              {user && isOnDashboard && (
                <nav className="space-y-0.5 border-b border-charcoal-100 p-3">
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                    {area === "vendor" ? "Vendor dashboard" : area === "driver" ? "Driver dashboard" : area === "admin" ? "Admin dashboard" : "My account"}
                  </p>
                  {full.map((item) => {
                    const isLinkActive = isActive(item);
                    // 3. Resolve dashboard layout icons safely via string name key lookup
                    const DynamicIcon = iconMap[item.iconName] ?? Icons.HelpCircle;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition group",
                          isLinkActive 
                            ? "bg-amber-50 text-amber-800 font-semibold" 
                            : "text-charcoal-700 hover:bg-charcoal-50"
                        )}
                      >
                        <DynamicIcon className={cn("h-4 w-4 shrink-0 transition-colors", isLinkActive ? "text-amber-600" : "text-charcoal-400 group-hover:text-charcoal-600")} />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              )}

              {/* Public Marketing Directives Section */}
              <nav className="space-y-0.5 p-3">
                <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Explore</p>
                {PUBLIC_NAV.map((item) => {
                  const isLinkActive = isActive(item);
                  // 4. Resolve public nav icons here using item.iconName as well
                  const DynamicIcon = iconMap[item.iconName] ?? Icons.HelpCircle;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition group",
                        isLinkActive
                          ? "bg-amber-50 text-amber-800 font-semibold"
                          : "text-charcoal-700 hover:bg-charcoal-50"
                      )}
                    >
                      <DynamicIcon className={cn("h-4 w-4 shrink-0 transition-colors", isLinkActive ? "text-amber-600" : "text-charcoal-400 group-hover:text-charcoal-700")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-charcoal-300 opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-charcoal-100 bg-white p-3.5 mt-auto">
              {user ? (
                <div className="space-y-2">
                  {!isOnDashboard && (
                    <Link
                      href={DASHBOARD_PATH[user.globalRole] ?? "/"}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-charcoal-800 px-4 py-2.5 text-sm font-semibold text-cream-100 shadow-sm transition hover:bg-charcoal-700 active:scale-98"
                    >
                      Go to dashboard
                    </Link>
                  )}
                  <form action={logoutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50/60 active:scale-98"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="flex h-10 items-center justify-center rounded-xl border border-charcoal-200 bg-white text-sm font-semibold text-charcoal-800 shadow-sm transition hover:bg-charcoal-50 active:scale-98"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="flex h-10 items-center justify-center rounded-xl bg-amber-600 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-98"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
