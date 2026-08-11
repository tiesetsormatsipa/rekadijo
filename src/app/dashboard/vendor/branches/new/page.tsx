import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewBranchForm } from "./new-branch-form";

export default async function NewBranchPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] }
  });
  if (!business) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Add a branch</h1>
      <p className="mt-1 text-charcoal-500">Add another location for {business.name} — same brand, same menu, its own settings.</p>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <NewBranchForm businessId={business.id} />
      </div>
    </div>
  );
}
