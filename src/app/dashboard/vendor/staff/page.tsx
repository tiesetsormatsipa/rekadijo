import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteStaffForm } from "./invite-staff-form";
import { CustomRoleBuilder } from "./custom-role-builder";
import { RemoveStaffButton } from "./remove-staff-button";
import { Badge } from "@/components/ui/badge";

export default async function VendorStaffPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] }
  });
  if (!business) return null;

  const [staff, permissions, customRoles] = await Promise.all([
    prisma.businessStaff.findMany({
      where: { businessId: business.id, isActive: true },
      include: { user: { include: { roles: { where: { businessId: business.id }, include: { role: true } } } } },
      orderBy: { invitedAt: "asc" }
    }),
    prisma.permission.findMany({ orderBy: { category: "asc" } }),
    prisma.role.findMany({ where: { key: { startsWith: `custom_${business.id}_` } } })
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Staff &amp; roles</h1>
      <p className="mt-1 text-charcoal-500">{business.name}</p>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Team members</h2>
        <div className="mt-3 divide-y divide-charcoal-50">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-charcoal-900">
                  {s.user.firstName} {s.user.lastName}
                </p>
                <p className="text-xs text-charcoal-500">{s.role.replaceAll("_", " ")}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.user.roles.map((ra) => (
                  <Badge key={ra.id} tone="info">
                    {ra.role.name}
                  </Badge>
                ))}
                {s.role !== "OWNER" && <RemoveStaffButton businessStaffId={s.id} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Invite staff</h2>
        <p className="mt-1 text-xs text-charcoal-500">
          The person must already have a RekaDijo account (any role) — inviting them upgrades their access for this
          business only.
        </p>
        <div className="mt-4">
          <InviteStaffForm businessId={business.id} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Custom roles</h2>
        <p className="mt-1 text-xs text-charcoal-500">
          Build a role from individual permissions — e.g. a &quot;Weekend Manager&quot; who can respond to
          quotations and manage orders but not edit business settings.
        </p>
        <div className="mt-4 space-y-2">
          {customRoles.map((r) => (
            <Badge key={r.id} tone="neutral">
              {r.name}
            </Badge>
          ))}
        </div>
        <div className="mt-4">
          <CustomRoleBuilder businessId={business.id} permissions={permissions.map((p) => ({ key: p.key, label: p.label, category: p.category }))} />
        </div>
      </div>
    </div>
  );
}
