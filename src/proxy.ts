import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "auth-token";
const JWT_SECRET = process.env.JWT_SECRET || "default-fallback-secure-secret-key-32-chars";
const key = new TextEncoder().encode(JWT_SECRET);

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const path = request.nextUrl.pathname;

  const isAuthRoute = path === "/login" || path === "/register" || path === "/forgot-password" || path === "/reset-password";
  const isSenderRoute = path === "/dashboard" || path.startsWith("/dashboard/");
  const isAdminRoute = path.startsWith("/admin");

  // 1. Unauthenticated users trying to access protected paths
  if (!token && (isSenderRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", request.url);
    // Add redirect parameter to return back
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ["HS256"],
      });

      const role = payload.role as string;
      const status = payload.status as string;

      // Ensure account is ACTIVE, otherwise clear cookie and redirect
      if (status !== "ACTIVE" && (isSenderRoute || isAdminRoute || isAuthRoute)) {
        const response = NextResponse.redirect(new URL("/login?error=account_disabled", request.url));
        response.cookies.delete(COOKIE_NAME);
        return response;
      }

      // Authenticated users trying to access login/register
      if (isAuthRoute) {
        if (role === "SUPER_ADMIN" || role === "FINANCE_ADMIN" || role === "SUPPORT_ADMIN" || role === "CONTENT_ADMIN") {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // Normal Senders trying to access Super Admin dashboard
      if (isAdminRoute && role === "SENDER") {
        return NextResponse.redirect(new URL("/dashboard?error=unauthorized", request.url));
      }

    } catch (error) {
      // Invalid or expired token
      if (isSenderRoute || isAdminRoute) {
        const response = NextResponse.redirect(new URL("/login?error=session_expired", request.url));
        response.cookies.delete(COOKIE_NAME);
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
