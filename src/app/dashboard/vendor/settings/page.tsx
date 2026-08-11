import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function VendorSettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await prisma.business.findFirst({
    where: { OR: [{ ownerId: user.id }, { staff: { some: { userId: user.id, isActive: true } } }] }
  });
  if (!business) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Business settings</h1>
      <p className="mt-1 text-charcoal-500">{business.name}</p>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <SettingsForm
          businessId={business.id}
          description={business.description ?? ""}
          category={business.category}
          whatsapp={business.whatsapp ?? ""}
          email={business.email ?? ""}
          minOrderAmount={business.minOrderAmount ? Number(business.minOrderAmount) : undefined}
          leadTimeHours={business.leadTimeHours}
          quotationResponseHours={business.quotationResponseHours}
          orderingMode={business.orderingMode}
        />
      </div>
    </div>
  );
}
