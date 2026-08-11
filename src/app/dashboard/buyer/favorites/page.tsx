import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatZAR } from "@/lib/utils";

export const metadata = { title: "Favorites" };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const favorites = await prisma.favoriteMenuItem.findMany({
    where: { userId: user.id },
    include: { menuItem: { include: { business: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Favorite dishes</h1>
      <p className="mt-1 text-charcoal-500">Items you&apos;ve hearted across vendors.</p>

      <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {favorites.length === 0 && (
          <p className="p-6 text-sm text-charcoal-500">
            No favorites yet — tap the heart on any menu item to save it here.
          </p>
        )}
        {favorites.map((f) => (
          <Link
            key={f.id}
            href={`/vendors/${f.menuItem.business.slug}`}
            className="flex items-center justify-between gap-3 p-4 hover:bg-charcoal-50"
          >
            <div>
              <p className="text-sm font-semibold text-charcoal-900">{f.menuItem.name}</p>
              <p className="text-xs text-charcoal-500">{f.menuItem.business.name}</p>
            </div>
            <span className="text-sm font-medium text-charcoal-800">{formatZAR(Number(f.menuItem.basePrice))}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
