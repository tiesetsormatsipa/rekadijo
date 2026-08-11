import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Notifications</h1>

      <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {notifications.length === 0 && <p className="p-6 text-sm text-charcoal-500">No notifications yet.</p>}
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.linkUrl ?? "#"}
            className={`flex items-start justify-between gap-3 p-4 hover:bg-charcoal-50 ${!n.isRead ? "bg-amber-50/50" : ""}`}
          >
            <div>
              <p className="text-sm font-semibold text-charcoal-900">{n.title}</p>
              <p className="mt-0.5 text-sm text-charcoal-500">{n.body}</p>
              <p className="mt-1 text-xs text-charcoal-400">{new Date(n.createdAt).toLocaleString("en-ZA")}</p>
            </div>
            {!n.isRead && <Badge tone="info">New</Badge>}
          </Link>
        ))}
      </div>
    </div>
  );
}
