import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Edge-level gate for the admin area. This is defense-in-depth alongside the
 * explicit `requireAdmin*()` checks in every admin page/action/route — if any
 * of those is ever missed, this still blocks the request.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isAdminPage = pathname.startsWith("/admin") && !isLoginPage;
  const isAdminApi = pathname.startsWith("/api/admin");

  if ((isAdminPage || isAdminApi) && !req.auth) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
