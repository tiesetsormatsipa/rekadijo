import { prisma } from "@/lib/prisma";
import { MapPageClient } from "@/components/map-page-client";

export const metadata = { title: "Map — RekaDijo" };

interface PageProps {
  searchParams: Promise<{ q?: string }> | { q?: string };
}

export default async function MapPage({ searchParams }: PageProps) {
  // Gracefully handles async searchParams for both Next.js 14 and Next.js 15+ variations
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const queryParam = resolvedParams?.q ?? "";

  // Deep fetch branches alongside active parent businesses and live menu inventory items
  const branches = await prisma.branch.findMany({
    where: { 
      isActive: true, 
      business: { 
        status: "APPROVED", 
        deletedAt: null 
      } 
    },
    include: { 
      business: {
        include: {
          menuItems: {
            where: {
              isActive: true,
              deletedAt: null
            },
            select: {
              name: true,
              description: true
            }
          }
        }
      } 
    }
  });

  // Map database entries smoothly into the structural payload your map UI handles
  const mapBranches = branches.map((b) => ({
    id: b.id,
    businessSlug: b.business.slug,
    businessName: b.business.name,
    branchName: b.name,
    city: b.city,
    lat: Number(b.latitude),
    lng: Number(b.longitude),
    rating: Number(b.business.avgRating),
    category: b.business.category,
    
    // Injecting the menu dataset so your client component deep scan works natively
    products: b.business.menuItems.map((item) => ({
      name: item.name,
      description: item.description || ""
    }))
  }));

  return <MapPageClient branches={mapBranches} initialQuery={queryParam} />;
}