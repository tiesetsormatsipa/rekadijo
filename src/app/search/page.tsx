import { prisma } from "@/lib/prisma";
import { VendorCard } from "@/components/vendor-card";
import { CategoryRow } from "@/components/category-row";
import { SearchBar } from "@/components/search-bar";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Search food" };

export default async function SearchPage({
  searchParams
}: {
  searchParams: { q?: string; mode?: string; sort?: string };
}) {
  const q = searchParams.q?.trim() ?? "";

  let businesses: Awaited<ReturnType<typeof runSearch>> = [];
  if (q) {
    businesses = await runSearch(q, searchParams.mode, searchParams.sort);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Search food</h1>
      <p className="mt-1 text-charcoal-500">Search for a dish — we&apos;ll show you every vendor who sells it.</p>

      <div className="mt-5 max-w-xl">
        <SearchBar initialQuery={q} />
      </div>

      <div className="mt-6">
        <CategoryRow />
      </div>

      {q && (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-charcoal-600">
              <span className="font-semibold text-charcoal-900">{businesses.length}</span> vendor
              {businesses.length !== 1 ? "s" : ""} selling &quot;{q}&quot;
            </p>
            <form className="flex gap-2" action="/search">
              <input type="hidden" name="q" value={q} />
              <select
                name="mode"
                defaultValue={searchParams.mode ?? ""}
                className="rounded-full border border-charcoal-200 bg-white px-3 py-1.5 text-xs focus-ring"
              >
                <option value="">Delivery or pickup</option>
                <option value="instant">Instant order</option>
                <option value="quotation">Quotation</option>
              </select>
              <select
                name="sort"
                defaultValue={searchParams.sort ?? "rating"}
                className="rounded-full border border-charcoal-200 bg-white px-3 py-1.5 text-xs focus-ring"
              >
                <option value="rating">Top rated</option>
                <option value="name">Name A–Z</option>
              </select>
              <button className="rounded-full bg-charcoal-800 px-3 py-1.5 text-xs font-semibold text-cream-100">Apply</button>
            </form>
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {businesses.length === 0 && (
              <p className="col-span-full rounded-xl border border-dashed border-charcoal-200 p-10 text-center text-charcoal-500">
                No vendors found selling &quot;{q}&quot; yet.
              </p>
            )}
            {businesses.map((business) => (
              <div key={business.id}>
                <VendorCard business={business} />
                {business.matchedItemNames.length > 0 && (
                  <p className="mt-1.5 truncate px-1 text-xs text-charcoal-400">
                    Matches: {business.matchedItemNames.slice(0, 3).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!q && (
        <p className="mt-10 rounded-xl border border-dashed border-charcoal-200 p-10 text-center text-charcoal-500">
          Try searching for &quot;kota&quot;, &quot;biscuits&quot;, or tap a category above.
        </p>
      )}
    </div>
  );
}

async function runSearch(q: string, mode?: string, sort?: string) {
  const where: Prisma.BusinessWhereInput = {
    status: "APPROVED",
    deletedAt: null,
    menuItems: { some: { name: { contains: q, mode: "insensitive" }, isActive: true, deletedAt: null } }
  };
  if (mode === "instant") where.orderingMode = { in: ["BOTH", "INSTANT_ONLY"] };
  if (mode === "quotation") where.orderingMode = { in: ["BOTH", "QUOTATION_ONLY"] };

  const results = await prisma.business.findMany({
    where,
    include: {
      branches: { where: { isActive: true }, take: 1 },
      menuItems: {
        where: { name: { contains: q, mode: "insensitive" }, isActive: true, deletedAt: null },
        select: { name: true },
        take: 5
      }
    },
    orderBy: sort === "name" ? { name: "asc" } : { avgRating: "desc" }
  });

  return results.map((b) => ({ ...b, matchedItemNames: b.menuItems.map((m) => m.name) }));
}
