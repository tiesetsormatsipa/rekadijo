import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3400";

  const businesses = await prisma.business.findMany({
    where: { status: "APPROVED" },
    select: { slug: true, updatedAt: true }
  });

  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/vendors`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/search`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/map`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/how-it-works`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/help`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/vendors/join`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/legal/cookies`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/legal/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/legal/vendor-agreement`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/legal/driver-agreement`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/legal/community-guidelines`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/legal/accessibility`, changeFrequency: "yearly", priority: 0.2 },
    ...businesses.map((b) => ({
      url: `${baseUrl}/vendors/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}
