import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth-token";
import { canAccessDashboard } from "@/lib/rbac";

const DASHBOARD_AREA_BY_PREFIX: Array<{ prefix: string; area: "buyer" | "vendor" | "admin" | "driver" }> = [
  { prefix: "/dashboard/buyer", area: "buyer" },
  { prefix: "/dashboard/vendor", area: "vendor" },
  { prefix: "/dashboard/admin", area: "admin" },
  { prefix: "/dashboard/driver", area: "driver" }
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const match = DASHBOARD_AREA_BY_PREFIX.find((entry) => pathname.startsWith(entry.prefix));
  if (match && !canAccessDashboard(session.globalRole, match.area)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
