"use client";

import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import type { GlobalRole } from "@prisma/client";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell, type NotificationLite } from "@/components/notification-bell";
// 1. Swap out AddressBar for your high-standard AddressSelector
import { AddressSelector } from "@/components/address-selector"; 
import { MobileMenu } from "@/components/mobile-menu";
import { DASHBOARD_PATH } from "@/lib/nav-config";

export function SiteHeader({
  user,
  notifications = [],
  unreadCount = 0
}: {
  user: { firstName: string; globalRole: GlobalRole } | null;
  notifications?: NotificationLite[];
  unreadCount?: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-100/60 bg-cream-200/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo Layout */}
        <Link href="/" className="flex flex-none items-center gap-2 focus-ring rounded-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal-800 text-amber-400">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="hidden font-display text-xl font-semibold tracking-tight text-charcoal-800 sm:inline">
            Reka<span className="text-amber-600">Dijo</span>
          </span>
        </Link>

        {/* 2. Your upgraded dropdown now renders right in the center slot of the header link group */}
        <div className="flex-1 max-w-xs sm:max-w-none flex justify-center sm:justify-start sm:pl-4">
          <AddressSelector />
        </div>

        {/* Mid Navigation Links */}
        <nav className="hidden items-center gap-6 lg:flex">
          <Link href="/vendors" className="text-sm font-medium text-charcoal-600 hover:text-charcoal-900 focus-ring rounded">
            Find vendors
          </Link>
          <Link href="/map" className="text-sm font-medium text-charcoal-600 hover:text-charcoal-900 focus-ring rounded">
            Map
          </Link>
          <Link href="/search" className="text-sm font-medium text-charcoal-600 hover:text-charcoal-900 focus-ring rounded">
            Search
          </Link>
          <Link href="/how-it-works" className="text-sm font-medium text-charcoal-600 hover:text-charcoal-900 focus-ring rounded">
            How quotations work
          </Link>
          <Link href="/vendors/join" className="text-sm font-medium text-charcoal-600 hover:text-charcoal-900 focus-ring rounded">
            Sell on RekaDijo
          </Link>
          <Link href="/help" className="text-sm font-medium text-charcoal-600 hover:text-charcoal-900 focus-ring rounded">
            Help
          </Link>
        </nav>

        {/* Profile / Account Control Widgets */}
        <div className="flex flex-none items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href={DASHBOARD_PATH[user.globalRole] ?? "/"}
                className="hidden rounded-full bg-charcoal-800 px-4 py-2 text-sm font-medium text-cream-100 transition hover:bg-charcoal-700 focus-ring lg:inline-block"
              >
                Hi, {user.firstName} — Dashboard
              </Link>
              <NotificationBell notifications={notifications} unreadCount={unreadCount} />
              <span className="hidden sm:inline-flex">
                <LogoutButton />
              </span>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-medium text-charcoal-700 hover:text-charcoal-900 focus-ring rounded px-2 py-2 sm:inline-block"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-ring sm:inline-block"
              >
                Sign up
              </Link>
            </>
          )}
          <MobileMenu user={user} />
        </div>
      </div>
    </header>
  );
}