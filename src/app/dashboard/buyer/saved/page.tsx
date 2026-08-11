import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VendorCard } from "@/components/vendor-card";

export const metadata = { title: "Saved vendors" };

export default async function SavedVendorsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const saved = await prisma.savedVendor.findMany({
    where: { userId: user.id },
    include: { business: { include: { branches: { where: { isActive: true }, take: 1 } } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Saved vendors</h1>
      <p className="mt-1 text-charcoal-500">Vendors you&apos;ve bookmarked for quick access.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {saved.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-charcoal-200 p-10 text-center text-charcoal-500">
            No saved vendors yet. Tap &quot;Save&quot; on any vendor page to bookmark it here.
          </p>
        )}
        {saved.map((s) => (
          <VendorCard key={s.id} business={s.business} />
        ))}
      </div>
    </div>
  );
}
