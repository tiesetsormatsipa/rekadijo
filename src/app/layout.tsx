import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav } from "@/components/bottom-nav";
import { CookieBanner } from "@/components/cookie-banner";
import { AddressProvider } from "@/lib/address-store";
import { CartProvider } from "@/lib/cart-store";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: {
    default: "RekaDijo — Order food & get quotations for events, bulk & catering",
    template: "%s | RekaDijo"
  },
  description:
    "RekaDijo (BuyFood) is a quotation-first food ordering platform for bulk orders, catering, parties, church orders, office lunches and local food businesses. A TechTur Solutions product.",
  openGraph: {
    title: "RekaDijo — quotation-first food ordering",
    description:
      "Request quotations from local vendors for bulk orders, catering and events, or order instantly where enabled.",
    siteName: "RekaDijo",
    type: "website"
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3400")
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const notifications = user
    ? await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8
      })
    : [];
  const unreadCount = user ? await prisma.notification.count({ where: { userId: user.id, isRead: false } }) : 0;
  const addresses = user ? await prisma.buyerAddress.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }) : [];

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AddressProvider
          initialAddresses={addresses.map((a) => ({
            id: a.id,
            label: a.label,
            addressLine: a.addressLine,
            city: a.city,
            latitude: a.latitude ? Number(a.latitude) : null,
            longitude: a.longitude ? Number(a.longitude) : null,
            isDefault: a.isDefault
          }))}
        >
          <CartProvider>
            <SiteHeader
              user={user ? { firstName: user.firstName, globalRole: user.globalRole } : null}
              notifications={notifications.map((n) => ({
                id: n.id,
                title: n.title,
                body: n.body,
                linkUrl: n.linkUrl,
                isRead: n.isRead,
                createdAt: n.createdAt.toISOString()
              }))}
              unreadCount={unreadCount}
            />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <SiteFooter />
            <BottomNav role={user?.globalRole ?? null} />
            <CookieBanner />
            <Toaster position="top-center" richColors closeButton />
          </CartProvider>
        </AddressProvider>
      </body>
    </html>
  );
}
