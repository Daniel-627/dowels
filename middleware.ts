import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

const roleRoutes: Record<string, string[]> = {
  "/studio": ["ADMIN"],
  "/dashboard/admin": ["ADMIN"],
  "/dashboard/landlord": ["LANDLORD", "ADMIN"],
  "/dashboard/tenant": ["TENANT", "LANDLORD", "ADMIN"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);
  const session = req.auth;

  // Not logged in → redirect to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged in → don't let them access login/register again
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL(`/dashboard/${session.user.role.toLowerCase()}`, req.url));
  }

  // Role-based protection
  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      if (!session || !allowedRoles.includes(session.user.role)) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
