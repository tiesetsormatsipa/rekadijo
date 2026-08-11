import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ButtonLink } from "@/components/ui/button";
import { VendorCard } from "@/components/vendor-card";
import { CategoryRow } from "@/components/category-row";
import { SearchBar } from "@/components/search-bar";
import { NearbyVendorsSection } from "@/components/nearby-vendors-section";
import { ArrowRight, ClipboardList, ShieldCheck, Truck } from "lucide-react";

export default async function HomePage() {
  const businesses = await prisma.business.findMany({
    where: { status: "APPROVED", deletedAt: null },
    include: { branches: { where: { isActive: true }, take: 1 } },
    orderBy: { avgRating: "desc" },
    take: 8
  });

  const categories = Array.from(new Set(businesses.map((b) => b.category)));

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal-900">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top_right,theme(colors.amber.500),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-300">
              Quotation-first food ordering
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-cream-100 sm:text-5xl">
              Get a real quote before you pay — for parties, events &amp; bulk orders.
            </h1>
            <p className="mt-5 text-lg text-charcoal-200">
              RekaDijo connects you with local vendors, kota &amp; sphatlo sellers, home cooks, and caterers.
              Request a quotation for your event, review it, and pay only once it&apos;s approved. Need it now?
              Some vendors also support instant ordering.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ButtonLink href="/vendors" size="lg">
                Find vendors <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="outline" className="border-white/30 text-cream-100 hover:bg-white/10">
                How quotations work
              </ButtonLink>
            </div>
            <div className="mt-8 max-w-lg">
              <SearchBar placeholder="Search kota, biscuits, pizza, ginger beer..." />
            </div>
          </div>
        </div>
      </section>

      {/* Category browsing */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold text-charcoal-900">Order by category</h2>
        <div className="mt-4">
          <CategoryRow />
        </div>
      </section>

      {/* Nearby vendors (location-aware) */}
      <NearbyVendorsSection />

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <ValueProp
            icon={<ClipboardList className="h-5 w-5" />}
            title="Request, don't just order"
            body="Build a quotation with quantities, event details, and your preferred date — vendors respond with real pricing."
          />
          <ValueProp
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Pay after approval"
            body="Payment only happens once you've accepted the vendor's quotation. No surprises, no upfront risk."
          />
          <ValueProp
            icon={<Truck className="h-5 w-5" />}
            title="Pickup or delivery"
            body="Choose collection or delivery where available. We'll tell you if a branch is too far for delivery."
          />
        </div>
      </section>

      {/* Business types */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
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

      {/* Featured vendors */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-charcoal-900">Top-rated vendors</h2>
          <Link href="/vendors" className="text-sm font-semibold text-amber-700 hover:text-amber-800">
            View all
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {businesses.length === 0 ? (
            <p className="col-span-full rounded-xl border border-dashed border-charcoal-200 p-8 text-center text-charcoal-500">
              No vendors yet — run <code className="rounded bg-charcoal-100 px-1">npm run db:seed</code> to load sample data.
            </p>
          ) : (
            businesses.map((business) => <VendorCard key={business.id} business={business} />)
          )}
        </div>
      </section>

      {/* Bulk / event CTA */}
      <section className="bg-olive-50">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-charcoal-900">
            Planning a party, church event, or office lunch?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-charcoal-600">
            Skip the guesswork. Tell a vendor what you need and get a proper quotation for bulk quantities —
            biscuits by the bucket, bread by the dozen, ginger beer by the 20L.
          </p>
          <ButtonLink href="/vendors" size="lg" className="mt-6">
            Start a quotation request
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function ValueProp({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">{icon}</div>
      <h3 className="mt-4 font-semibold text-charcoal-900">{title}</h3>
      <p className="mt-1.5 text-sm text-charcoal-500">{body}</p>
    </div>
  );
}
