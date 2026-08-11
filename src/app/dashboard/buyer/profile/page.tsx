import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";
import { AddressForm } from "./address-form";
import { DeleteAddressButton } from "./delete-address-button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Profile settings" };

export default async function BuyerProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const addresses = await prisma.buyerAddress.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Profile settings</h1>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Your details</h2>
        <p className="mt-1 text-xs text-charcoal-400">{user.email} · can&apos;t be changed here</p>
        <div className="mt-4">
          <ProfileForm firstName={user.firstName} lastName={user.lastName} phone={user.phone ?? ""} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Delivery addresses</h2>
        <div className="mt-3 space-y-2">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-charcoal-100 p-3 text-sm">
              <div>
                <p className="font-medium text-charcoal-800">
                  {a.label} {a.isDefault && <Badge tone="info">Default</Badge>}
                </p>
                <p className="text-charcoal-500">
                  {a.addressLine}, {a.city} {a.postalCode}
                </p>
              </div>
              <DeleteAddressButton addressId={a.id} />
            </div>
          ))}
          {addresses.length === 0 && <p className="text-sm text-charcoal-500">No saved addresses yet.</p>}
        </div>
        <div className="mt-4 border-t border-charcoal-100 pt-4">
          <AddressForm />
        </div>
      </div>
    </div>
  );
}
