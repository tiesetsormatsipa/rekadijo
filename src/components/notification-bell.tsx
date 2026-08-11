"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/server/actions/notifications";

export type NotificationLite = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell({ notifications, unreadCount }: { notifications: NotificationLite[]; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function openNotification(n: NotificationLite) {
    if (!n.isRead) {
      startTransition(async () => {
        await markNotificationReadAction(n.id);
        router.refresh();
      });
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 hover:text-charcoal-800 focus-ring"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-charcoal-100 bg-white p-2 shadow-cardHover">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-semibold text-charcoal-800">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await markAllNotificationsReadAction();
                      router.refresh();
                    })
                  }
                  className="text-xs font-medium text-amber-700 hover:text-amber-800"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="mt-1 max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-2 py-6 text-center text-sm text-charcoal-400">No notifications yet.</p>
              )}
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.linkUrl ?? "/dashboard/notifications"}
                  onClick={() => openNotification(n)}
                  className={`block rounded-xl px-3 py-2 text-sm hover:bg-charcoal-50 ${!n.isRead ? "bg-amber-50/60" : ""}`}
                >
                  <p className="font-medium text-charcoal-800">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-charcoal-500">{n.body}</p>
                </Link>
              ))}
            </div>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-xl px-3 py-2 text-center text-xs font-semibold text-amber-700 hover:bg-charcoal-50"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
