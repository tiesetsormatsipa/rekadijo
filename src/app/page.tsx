import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { VendorCard } from "@/components/vendor-card";
import { CategoryRow } from "@/components/category-row";
import { SearchBar, type SearchSuggestion } from "@/components/search-bar";
import { NearbyVendorsSection } from "@/components/nearby-vendors-section";
import { ArrowRight, Clock, FileText, MapPin, Sparkles, Zap } from "lucide-react";
import { createBranchListings } from "@/lib/branch-listings";
import { formatZAR } from "@/lib/utils";

const MARKET_IMAGES = [
  "/uploads/00ff777a-46a0-4757-99d9-cd977e789ac6.jfif",
  "/uploads/0016d500-167a-4ad2-86db-c2d4efa57c4c.jfif",
  "/uploads/1fdcc778-2cb9-4f1c-a9e2-b0e43f3cd58c.jfif",
  "/uploads/c1baedf7-f841-421a-8fdb-5d4e14782dc7.jfif",
  "/uploads/dce150d7-c5aa-463e-b75e-ace5386524a1.jfif"
];

function fallbackImageFor(seed: string) {
  const index = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % MARKET_IMAGES.length;
  return MARKET_IMAGES[index];
}

export default async function HomePage() {
  const [businesses, menuItems] = await Promise.all([
    prisma.business.findMany({
      where: { status: "APPROVED", deletedAt: null },
      include: { branches: { where: { isActive: true } } },
      orderBy: { avgRating: "desc" },
      take: 8
    }),
    prisma.menuItem.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        business: { status: "APPROVED", deletedAt: null }
      },
      include: {
        media: { orderBy: { sortOrder: "asc" }, take: 1 },
        category: { select: { name: true } },
        business: {
          select: {
            name: true,
            slug: true,
            category: true,
            branches: { where: { isActive: true }, select: { id: true, city: true, suburb: true }, take: 1 }
          }
        }
      },
      orderBy: [{ allowInstantOrder: "desc" }, { createdAt: "desc" }],
      take: 12
    })
  ]);

  const categories = Array.from(new Set(businesses.map((b) => b.category)));
  const branchListings = createBranchListings(businesses, { limit: 8 });
  const productPreviews = menuItems.slice(0, 8);

  const suggestions: SearchSuggestion[] = [
    ...menuItems.map((item) => ({
      label: item.name,
      href: `/search?q=${encodeURIComponent(item.name)}`,
      eyebrow: `${item.category.name} at ${item.business.name}`,
      type: "item" as const
    })),
    ...businesses.map((business) => ({
      label: business.name,
      href: `/vendors/${business.slug}`,
      eyebrow: business.category,
      type: "vendor" as const
    })),
    ...categories.map((category) => ({
      label: category,
      href: `/vendors?category=${encodeURIComponent(category)}`,
      eyebrow: "Business type",
      type: "category" as const
    }))
  ];

  return (
    <div>
      <section className="relative min-h-[520px] overflow-hidden bg-charcoal-900">
        <Image
          src={MARKET_IMAGES[0]}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-55"
          unoptimized
        />
        <div className="absolute inset-0 bg-charcoal-900/55" />
        <div className="relative mx-auto flex min-h-[520px] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-charcoal-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Instant meals, quotes for bigger plans
            </div>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Order local food now or request a proper event quotation.
            </h1>
            <p className="mt-4 max-w-xl text-base text-cream-200 sm:text-lg">
              Find nearby branches, compare menus, reuse saved addresses, and switch between instant checkout and quotation requests.
            </p>
            <div className="mt-7 max-w-2xl">
              <SearchBar
                placeholder="Search chips, kota, scones, ginger beer..."
                suggestions={suggestions}
                showSuggestions
                inputClassName="py-4 pl-12 pr-5 text-base shadow-xl"
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["chips", "kota", "scones", "ginger beer"].map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-charcoal-800 transition hover:bg-amber-100"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-2xl border border-charcoal-100 bg-white p-3 shadow-card sm:grid-cols-3">
          <MarketplacePromise icon={<Zap className="h-4 w-4" />} title="Fast ordering" body="Checkout now where branches enable instant items." />
          <MarketplacePromise icon={<FileText className="h-4 w-4" />} title="Clean quotations" body="Build bulk and event requests without leaving the order page." />
          <MarketplacePromise icon={<MapPin className="h-4 w-4" />} title="Saved addresses" body="Reuse profile addresses and see delivery range feedback." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-charcoal-900">What are you craving?</h2>
            <p className="mt-1 text-sm text-charcoal-500">Tap a category or start typing above.</p>
          </div>
          <Link href="/search" className="hidden text-sm font-semibold text-amber-700 hover:text-amber-800 sm:inline">
            Search all
          </Link>
        </div>
        <div className="mt-4">
          <CategoryRow />
        </div>
      </section>

      {productPreviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-charcoal-900">Popular nearby picks</h2>
            <Link href="/search" className="text-sm font-semibold text-amber-700 hover:text-amber-800">
              Browse food
            </Link>
          </div>
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
            {productPreviews.map((item) => {
              const branch = item.business.branches[0];
              const href = branch ? `/vendors/${item.business.slug}?branch=${branch.id}` : `/vendors/${item.business.slug}`;
              const imageUrl = item.media[0]?.url ?? fallbackImageFor(item.name);

              return (
                <Link
                  key={item.id}
                  href={href}
                  className="group w-60 flex-none overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
                >
                  <div className="relative h-36 overflow-hidden bg-charcoal-100">
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      sizes="240px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <div className="p-4">
                    <p className="truncate font-semibold text-charcoal-900">{item.name}</p>
                    <p className="mt-0.5 truncate text-xs text-charcoal-500">{item.business.name}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-semibold text-charcoal-900">{formatZAR(Number(item.basePrice))}</span>
                      <span className="flex items-center gap-1 text-xs text-charcoal-500">
                        <Clock className="h-3.5 w-3.5" />
                        Quote or order
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <NearbyVendorsSection />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-charcoal-900">Top-rated branches</h2>
            <p className="mt-1 text-sm text-charcoal-500">Menus, delivery choices, and quotation support in one place.</p>
          </div>
          <Link href="/vendors" className="text-sm font-semibold text-amber-700 hover:text-amber-800">
            View all
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {branchListings.length === 0 ? (
            <p className="col-span-full rounded-xl border border-dashed border-charcoal-200 p-8 text-center text-charcoal-500">
              No vendors yet. Run <code className="rounded bg-charcoal-100 px-1">npm run db:seed</code> to load sample data.
            </p>
          ) : (
            branchListings.map((business) => <VendorCard key={business.id} business={business} />)
          )}
        </div>
      </section>

      <section className="border-y border-charcoal-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-semibold text-charcoal-900">Planning for a team, party, or church event?</h2>
            <p className="mt-3 max-w-2xl text-charcoal-600">
              Add items, quantities, date, notes, and delivery details on the vendor page. The quotation sits beside the menu, so the request stays clear while you compare instant-order options.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/vendors" size="lg">
              Start a quotation <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/how-it-works" size="lg" variant="outline">
              How it works
            </ButtonLink>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-semibold text-charcoal-900">Browse by business type</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/vendors?category=${encodeURIComponent(category)}`}
                className="rounded-full border border-charcoal-200 bg-white px-4 py-2 text-sm font-medium text-charcoal-700 shadow-sm transition hover:border-amber-400 hover:text-amber-700"
              >
                {category}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MarketplacePromise({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-3 py-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-charcoal-900 text-amber-300">
        {icon}
      </span>
      <span>
        <span className="block font-semibold text-charcoal-900">{title}</span>
        <span className="mt-0.5 block text-sm text-charcoal-500">{body}</span>
      </span>
    </div>
  );
}
