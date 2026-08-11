import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatZAR } from "@/lib/utils";
import { DriverAvailabilityToggle } from "./availability-toggle";
import { AssignmentStatusControl } from "./assignment-status-control";

export default async function DriverDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const driverProfile = await prisma.driverProfile.findUnique({
    where: { userId: user.id },
    include: {
      assignments: {
        include: { order: { include: { business: true, branch: true } } },
        orderBy: { assignedAt: "desc" }
      }
    }
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-900">Driver dashboard</h1>
          <p className="mt-1 text-charcoal-500">Welcome, {user.firstName}.</p>
        </div>
        {driverProfile && <DriverAvailabilityToggle isAvailable={driverProfile.isAvailable} />}
      </div>

      {driverProfile && (
        <div className="mt-4 rounded-xl border border-charcoal-100 bg-white p-4 text-sm text-charcoal-600 shadow-card">
          <p>
            Vehicle: {driverProfile.vehicleType ?? "—"} · Rating:{" "}
            {Number(driverProfile.avgRating).toFixed(1)} ({driverProfile.ratingCount} reviews)
          </p>
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-semibold text-charcoal-800">Delivery assignments</h2>
        <div className="mt-3 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
          {(!driverProfile || driverProfile.assignments.length === 0) && (
            <p className="p-6 text-sm text-charcoal-500">No delivery assignments yet.</p>
          )}
          {driverProfile?.assignments.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-charcoal-900">{a.order.business.name}</p>
                <p className="text-xs text-charcoal-500">
                  {a.order.reference} · {a.order.branch.city}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-charcoal-800">{formatZAR(Number(a.order.total))}</span>
                <AssignmentStatusControl assignmentId={a.id} status={a.status} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
