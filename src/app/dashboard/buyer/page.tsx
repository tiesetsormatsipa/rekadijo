import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_TONE } from "@/lib/quotation";
import { formatZAR } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

export default async function BuyerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [quotations, orders] = await Promise.all([
    prisma.quotation.findMany({
      where: { buyerId: user.id },
      include: { business: true, branch: true },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: { business: true },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-900">My quotations &amp; orders</h1>
          <p className="mt-1 text-charcoal-500">Welcome back, {user.firstName}.</p>
        </div>
        <ButtonLink href="/vendors">Browse vendors</ButtonLink>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/dashboard/buyer/saved" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Saved vendors
        </Link>
        <Link href="/dashboard/buyer/favorites" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Favorite dishes
        </Link>
        <Link href="/dashboard/buyer/profile" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Profile settings
        </Link>
        <Link href="/dashboard/messages" className="rounded-full border border-charcoal-200 px-4 py-2 font-medium text-charcoal-600 hover:bg-charcoal-50">
          Messages
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="font-semibold text-charcoal-800">Quotation requests</h2>
        <div className="mt-3 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
          {quotations.length === 0 && (
            <p className="p-6 text-sm text-charcoal-500">
              No quotation requests yet.{" "}
              <Link href="/vendors" className="font-semibold text-amber-700">
                Find a vendor
              </Link>{" "}
              to get started.
            </p>
          )}
          {quotations.map((q) => (
            <Link
              key={q.id}
              href={`/dashboard/buyer/quotations/${q.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-charcoal-50"
            >
              <div>
                <p className="text-sm font-semibold text-charcoal-900">{q.business.name}</p>
                <p className="text-xs text-charcoal-500">
                  {q.reference} · {q.branch.city} · {new Date(q.requestedDate).toLocaleDateString("en-ZA")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-charcoal-800">{formatZAR(Number(q.total))}</span>
                <Badge tone={QUOTATION_STATUS_TONE[q.status]}>{QUOTATION_STATUS_LABELS[q.status]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold text-charcoal-800">Orders</h2>
        <div className="mt-3 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
          {orders.length === 0 && <p className="p-6 text-sm text-charcoal-500">No orders yet.</p>}
          {orders.map((o) => (
            <Link key={o.id} href={`/dashboard/buyer/orders/${o.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-charcoal-50">
              <div>
                <p className="text-sm font-semibold text-charcoal-900">{o.business.name}</p>
                <p className="text-xs text-charcoal-500">{o.reference}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-charcoal-800">{formatZAR(Number(o.total))}</span>
                <Badge tone="info">{o.status.replaceAll("_", " ")}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
