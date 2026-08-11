import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { SuspendUserButton } from "./suspend-user-button";

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const users = await prisma.user.findMany({
    where: searchParams.q
      ? {
          OR: [
            { email: { contains: searchParams.q, mode: "insensitive" } },
            { firstName: { contains: searchParams.q, mode: "insensitive" } },
            { lastName: { contains: searchParams.q, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-charcoal-900">Users</h1>

      <form className="mt-4" action="/dashboard/admin/users">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search by name or email..."
          className="w-full max-w-sm rounded-full border border-charcoal-200 bg-white px-4 py-2.5 text-sm focus-ring"
        />
      </form>

      <div className="mt-6 divide-y divide-charcoal-100 rounded-2xl border border-charcoal-100 bg-white shadow-card">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-charcoal-900">
                {u.firstName} {u.lastName} {u.isDevSeed && <Badge tone="neutral">Seed</Badge>}
              </p>
              <p className="text-xs text-charcoal-500">
                {u.email} · {u.globalRole}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={u.status === "ACTIVE" ? "success" : "danger"}>{u.status.replaceAll("_", " ")}</Badge>
              {u.globalRole !== "SUPERADMIN" && (
                <SuspendUserButton userId={u.id} isSuspended={u.status === "SUSPENDED"} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
