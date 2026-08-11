import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DriverProfileForm } from "./driver-profile-form";

export const metadata = { title: "Driver profile" };

export default async function DriverProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Driver profile</h1>
      <p className="mt-1 text-charcoal-500">
        {user.firstName} {user.lastName} · {user.email}
      </p>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <DriverProfileForm vehicleType={profile.vehicleType ?? ""} licensePlate={profile.licensePlate ?? ""} />
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-card">
        <h2 className="font-semibold text-charcoal-800">Rating</h2>
        <p className="mt-2 text-3xl font-semibold text-charcoal-900">{Number(profile.avgRating).toFixed(1)} ★</p>
        <p className="text-sm text-charcoal-500">from {profile.ratingCount} review{profile.ratingCount !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}
