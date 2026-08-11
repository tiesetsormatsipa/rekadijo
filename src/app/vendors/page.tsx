import { prisma } from "@/lib/prisma";
import { VendorCard } from "@/components/vendor-card";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Find vendors" };

export default async function VendorsPage({
  searchParams
}: {
  searchParams: { q?: string; category?: string; mode?: string };
}) {
  const where: Prisma.BusinessWhereInput = {
    status: "APPROVED",
    deletedAt: null
  };

  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: "insensitive" } },
      { menuItems: { some: { name: { contains: searchParams.q, mode: "insensitive" } } } }
    ];
  }
  if (searchParams.category) where.category = searchParams.category;
  if (searchParams.mode === "instant") where.orderingMode = { in: ["BOTH", "INSTANT_ONLY"] };
  if (searchParams.mode === "quotation") where.orderingMode = { in: ["BOTH", "QUOTATION_ONLY"] };

  const [businesses, categories] = await Promise.all([
    prisma.business.findMany({
      where,
      include: { branches: { where: { isActive: true }, take: 1 } },
      orderBy: { avgRating: "desc" }
    }),
    prisma.business.findMany({
      where: { status: "APPROVED" },
      select: { category: true },
      distinct: ["category"]
    })
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Find vendors</h1>
      <p className="mt-2 text-charcoal-500">Search local vendors for bulk orders, catering, and everyday food.</p>

      <form className="mt-6 flex flex-wrap gap-3" action="/vendors">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search vendors or menu items..."
          className="min-w-[240px] flex-1 rounded-full border border-charcoal-200 bg-white px-4 py-2.5 text-sm focus-ring"
        />
        <select
          name="category"
          defaultValue={searchParams.category ?? ""}
          className="rounded-full border border-charcoal-200 bg-white px-4 py-2.5 text-sm focus-ring"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category}
            </option>
          ))}
        </select>
        <select
          name="mode"
          defaultValue={searchParams.mode ?? ""}
          className="rounded-full border border-charcoal-200 bg-white px-4 py-2.5 text-sm focus-ring"
        >
          <option value="">Any ordering mode</option>
          <option value="instant">Instant order available</option>
          <option value="quotation">Quotation available</option>
        </select>
        <button className="rounded-full bg-charcoal-800 px-5 py-2.5 text-sm font-semibold text-cream-100 focus-ring">
          Search
        </button>
      </form>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {businesses.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-charcoal-200 p-10 text-center text-charcoal-500">
            No vendors match your search.{" "}
            <Link href="/vendors" className="font-semibold text-amber-700">
              Clear filters
            </Link>
          </p>
        ) : (
          businesses.map((business) => <VendorCard key={business.id} business={business} />)
        )}
      </div>
    </div>
  );
}
