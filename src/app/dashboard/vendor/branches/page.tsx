import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BranchAvailabilityPanel } from "./branch-availability-panel";
import { BranchSettingsPanel } from "./branch-settings-panel";
import { HoursEditor } from "./hours-editor";
import { Button } from "@/components/ui/button";

export default async function VendorBranchesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] },
    include: {
      branches: {
        include: {
          operatingHours: { orderBy: { dayOfWeek: "asc" } },
          itemAvailability: { include: { menuItem: true } }
        }
      },
      menuItems: { where: { deletedAt: null } }
    }
  });
  if (!business) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal-900">Branches</h1>
          <p className="mt-1 text-charcoal-500">
            {business.name} operates {business.branches.length} branch{business.branches.length !== 1 ? "es" : ""} under one
            brand. Toggle item availability, stock, and instant ordering per branch.
          </p>
        </div>
        <Link href="/dashboard/vendor/branches/new">
          <Button size="sm">Add branch</Button>
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        {business.branches.map((branch) => (
          <div key={branch.id} className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-charcoal-900">{branch.name}</h2>
                <p className="text-sm text-charcoal-500">
                  {branch.addressLine}, {branch.city} {branch.postalCode}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge tone={branch.isActive ? "success" : "danger"}>{branch.isActive ? "Active" : "Inactive"}</Badge>
                <Badge tone="neutral">{branch.fulfillmentType}</Badge>
                {branch.acceptsInstantOrders && <Badge tone="success">Instant ordering on</Badge>}
                {branch.deliveryRadiusKm ? <Badge tone="info">Delivery radius {String(branch.deliveryRadiusKm)}km</Badge> : null}
              </div>
            </div>

            <BranchSettingsPanel
              branchId={branch.id}
              fulfillmentType={branch.fulfillmentType}
              deliveryRadiusKm={branch.deliveryRadiusKm ? Number(branch.deliveryRadiusKm) : null}
              acceptsInstantOrders={branch.acceptsInstantOrders}
              isActive={branch.isActive}
            />

            <HoursEditor
              branchId={branch.id}
              hours={branch.operatingHours.map((h) => ({
                dayOfWeek: h.dayOfWeek,
                openTime: h.openTime,
                closeTime: h.closeTime,
                isClosed: h.isClosed
              }))}
            />

            <BranchAvailabilityPanel
              branchId={branch.id}
              menuItems={business.menuItems.map((mi) => {
                const avail = branch.itemAvailability.find((a) => a.menuItemId === mi.id);
                return {
                  menuItemId: mi.id,
                  name: mi.name,
                  isAvailable: avail?.isAvailable ?? true,
                  isInstantOrderable: avail?.isInstantOrderable ?? mi.allowInstantOrder,
                  stockQuantity: avail?.stockQuantity ?? null
                };
              })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
